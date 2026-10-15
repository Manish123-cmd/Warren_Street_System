"""MongoDB manifest/lease and Google Drive adapters. No live records are mutated."""
from contextlib import contextmanager
from datetime import datetime, timedelta
from hashlib import md5
from io import BytesIO
import uuid

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload

from .core import MIME, UTC, period_bounds

FOLDER = 'application/vnd.google-apps.folder'
FILE_FIELDS = 'id,name,parents,mimeType,size,md5Checksum,trashed,appProperties'


class MongoStore:
    def __init__(self, database, manifest_collection):
        self.database = database
        self.manifests = database[manifest_collection]
        self.owner = None

    @contextmanager
    def lock(self):
        owner = uuid.uuid4().hex
        now = datetime.now(UTC)
        try:
            self.manifests.update_one({'_id': 'backup-lock'}, {'$setOnInsert': {'expires': now}}, upsert=True)
        except DuplicateKeyError:
            pass
        row = self.manifests.find_one_and_update(
            {'_id': 'backup-lock', 'expires': {'$lte': now}},
            {'$set': {'owner': owner, 'expires': now + timedelta(hours=2)}},
            return_document=ReturnDocument.AFTER,
        )
        if not row:
            raise RuntimeError('Another backup or retention run holds the lease')
        self.owner = owner
        try:
            yield
        finally:
            self.manifests.update_one({'_id': 'backup-lock', 'owner': owner}, {'$set': {'expires': datetime.now(UTC)}})
            self.owner = None

    def heartbeat(self):
        now = datetime.now(UTC)
        result = self.manifests.update_one(
            {'_id': 'backup-lock', 'owner': self.owner, 'expires': {'$gt': now}},
            {'$set': {'expires': now + timedelta(hours=2)}},
        )
        if not result.matched_count:
            raise RuntimeError('Backup lease expired; stop and retry')

    def get_or_create(self, key, initial):
        self.heartbeat()
        self.manifests.update_one({'_id': key}, {'$setOnInsert': initial}, upsert=True)
        return self.manifests.find_one({'_id': key})

    def save(self, manifest):
        self.heartbeat()
        self.manifests.replace_one({'_id': manifest['_id']}, manifest)

    def documents(self, spec, start):
        self.heartbeat()
        lower, upper = period_bounds(start)
        if spec['date_type'] == 'date-string':
            lower, upper = start.isoformat(), (start + timedelta(days=7)).isoformat()
        query = {spec['date_field']: {'$gte': lower, '$lt': upper}}
        collection = self.database[spec['collection']]
        if spec['collection'] not in self.database.list_collection_names():
            raise ValueError('Configured source collection does not exist')
        # Read only explicitly approved fields, plus the source identifier.
        projection = {field: 1 for field in spec['fields'].values()}
        projection['_id'] = 1
        return list(collection.find(query, projection).sort('_id', 1))

    def completed(self):
        return list(self.manifests.find({'status': 'complete', 'kind': 'weekly'}))


class Drive:
    def __init__(self, service):
        self.service = service

    def new_id(self):
        return self.service.files().generateIds(count=1, space='drive', type='files').execute(num_retries=3)['ids'][0]

    def get(self, file_id):
        try:
            return self.service.files().get(fileId=file_id, fields=FILE_FIELDS, supportsAllDrives=True).execute(num_retries=3)
        except HttpError as error:
            if error.resp.status == 404:
                return None
            raise

    def folders(self, parent, name):
        def escape(value):
            return value.replace('\\', '\\\\').replace("'", "\\'")
        query = f"'{escape(parent)}' in parents and name = '{escape(name)}' and mimeType = '{FOLDER}' and trashed = false"
        result, token = [], None
        while True:
            page = self.service.files().list(q=query, fields='nextPageToken,files(id,name,parents,mimeType,trashed)',
                pageToken=token, includeItemsFromAllDrives=True, supportsAllDrives=True).execute(num_retries=3)
            result.extend(page.get('files', []))
            token = page.get('nextPageToken')
            if not token:
                return result

    def create_folder(self, file_id, parent, name):
        return self.service.files().create(body={'id': file_id, 'name': name, 'parents': [parent], 'mimeType': FOLDER},
            fields=FILE_FIELDS, supportsAllDrives=True).execute(num_retries=3)

    def upload(self, file_id, parent, name, content, properties):
        media = MediaIoBaseUpload(BytesIO(content), mimetype=MIME, resumable=True)
        request = self.service.files().create(body={'id': file_id, 'name': name, 'parents': [parent],
            'mimeType': MIME, 'appProperties': properties}, media_body=media, fields=FILE_FIELDS, supportsAllDrives=True)
        result = None
        while result is None:
            _, result = request.next_chunk(num_retries=3)
        return result

    def trash(self, file_id):
        return self.service.files().update(fileId=file_id, body={'trashed': True},
            fields=FILE_FIELDS, supportsAllDrives=True).execute(num_retries=3)


def checksum(content):
    return md5(content, usedforsecurity=False).hexdigest()
