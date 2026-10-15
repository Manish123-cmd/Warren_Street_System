"""Idempotent weekly exports, with persistent IDs allocated before any upload."""
from datetime import datetime, timedelta
from hashlib import sha256
import json

from .core import CATEGORIES, LONDON, MIME, UTC, reporting_week, run_names, workbook
from .storage import FOLDER, checksum


def verify(file, artifact, parent, properties, allow_trashed=False):
    if (not file or (file.get('trashed', False) and not allow_trashed)
            or file.get('name') != artifact['name'] or parent not in file.get('parents', [])
            or file.get('mimeType') != MIME
            or str(file.get('size')) != str(artifact['size'])
            or file.get('md5Checksum') != artifact['md5']
            or file.get('appProperties') != properties):
        raise RuntimeError('Backup verification failed; existing files have been preserved')


def folder(store, drive, manifest, parent, name, slot):
    matches = drive.folders(parent, name)
    if len(matches) > 1:
        raise RuntimeError('Ambiguous Drive folder; choose a unique backup parent')
    if matches:
        return matches[0]['id']
    planned = manifest.setdefault('folders', {}).get(slot)
    if not planned:
        planned = drive.new_id()
        manifest['folders'][slot] = planned
        store.save(manifest)
    existing = drive.get(planned)
    if existing:
        if (existing.get('trashed') or existing.get('mimeType') != FOLDER
                or existing.get('name') != name or parent not in existing.get('parents', [])):
            raise RuntimeError('Planned folder changed; nothing was overwritten')
    else:
        drive.create_folder(planned, parent, name)
    return planned


def backup(store, drive, sources, parent, now, requested=None):
    start, end = reporting_week(now, requested)
    timestamp, path = run_names(now)
    config_hash = sha256(json.dumps({'sources': sources, 'parent': parent}, sort_keys=True).encode()).hexdigest()
    with store.lock():
        manifest = store.get_or_create('weekly:' + start.isoformat(), {
            'kind': 'weekly', 'week_start': start.isoformat(), 'week_end': end.isoformat(),
            'timestamp': timestamp, 'backup_time': now.astimezone(LONDON).isoformat(),
            'folder_path': list(path), 'config_hash': config_hash, 'parent': parent,
            'artifacts': {}, 'status': 'running', 'attempts': 0,
        })
        if manifest['config_hash'] != config_hash:
            raise ValueError('This week already has a different source or destination configuration')
        if manifest.get('retired') or manifest.get('retention_in_progress'):
            raise ValueError('This backup was explicitly retired; automatic recreation is disabled')
        manifest['attempts'] += 1
        manifest['status'] = 'running'
        store.save(manifest)
        try:
            destination = parent
            # Destination follows the first backup attempt's London date, including on retry.
            for slot, name in enumerate(['Warren Street Backups', *manifest['folder_path']]):
                destination = folder(store, drive, manifest, destination, name, str(slot))
            manifest['destination'] = destination
            store.save(manifest)
            for category in CATEGORIES:
                store.heartbeat()
                properties = {'warrenWeek': manifest['week_start'], 'warrenCategory': category, 'warrenRun': manifest['timestamp']}
                artifact = manifest['artifacts'].get(category)
                if artifact:
                    existing = drive.get(artifact['id'])
                    if existing:
                        verify(existing, artifact, destination, properties)
                        artifact['verified'] = True
                        store.save(manifest)
                        continue
                    if artifact.get('verified'):
                        raise RuntimeError('Previously verified file is missing; manual recovery required')
                documents = store.documents(sources[category], start)
                content = workbook(category, documents, sources[category], manifest)
                if artifact and (artifact['md5'] != checksum(content) or artifact['size'] != len(content)):
                    raise RuntimeError('Source changed during an unfinished upload; existing backup files preserved for manual recovery')
                artifact = {
                    'id': artifact['id'] if artifact else drive.new_id(),
                    'name': f"{manifest['timestamp']}_{category}.xlsx",
                    'size': len(content), 'md5': checksum(content), 'rows': len(documents), 'verified': False,
                }
                manifest['artifacts'][category] = artifact
                # Persist ID + checksum BEFORE uploading. A timeout after create is recoverable.
                store.save(manifest)
                store.heartbeat()
                drive.upload(artifact['id'], destination, artifact['name'], content, properties)
                verify(drive.get(artifact['id']), artifact, destination, properties)
                artifact['verified'] = True
                store.save(manifest)
            manifest['status'] = 'complete'
            manifest['completed_at'] = datetime.now(UTC).isoformat()
            manifest.pop('error_type', None)
            store.save(manifest)
            return manifest
        except Exception as error:
            manifest['status'] = 'failed'
            manifest['error_type'] = type(error).__name__  # Never log tokens, URIs or document contents.
            store.save(manifest)
            raise


def retention_plan(store, days, now, parent):
    if not days or days < 1:
        return {'retention_enabled': False, 'backups': []}
    cutoff = now - timedelta(days=days)
    backups = []
    for manifest in store.completed():
        if (manifest.get('parent') == parent and not manifest.get('retired')
                and datetime.fromisoformat(manifest['backup_time']) < cutoff
                and set(manifest['artifacts']) == set(CATEGORIES)
                and all(a.get('verified') for a in manifest['artifacts'].values())):
            backups.append({'manifest_id': manifest['_id'], 'files': {k: a['id'] for k, a in manifest['artifacts'].items()}})
    return {'retention_enabled': True, 'generated_at': now.isoformat(), 'parent': parent, 'days': days, 'backups': backups}


def apply_retention(store, drive, approved_plan, days, now, parent):
    """Only an explicitly supplied plan can trash files; never called by weekly jobs."""
    if not days:
        raise ValueError('Retention is disabled')
    with store.lock():
        eligible = {b['manifest_id']: b for b in retention_plan(store, days, now, parent)['backups']}
        requested = approved_plan.get('backups', [])
        if approved_plan.get('parent') != parent or any(eligible.get(b.get('manifest_id')) != b for b in requested):
            raise ValueError('Retention plan no longer matches eligible backups')
        manifests = {m['_id']: m for m in store.completed()}
        # Validate the entire plan before changing any file.
        for entry in requested:
            manifest = manifests[entry['manifest_id']]
            for category, artifact in manifest['artifacts'].items():
                verify(drive.get(artifact['id']), artifact, manifest['destination'],
                       {'warrenWeek': manifest['week_start'], 'warrenCategory': category, 'warrenRun': manifest['timestamp']}, allow_trashed=True)
        for entry in requested:
            manifest = manifests[entry['manifest_id']]
            manifest['retention_in_progress'] = True
            store.save(manifest)
            for artifact in manifest['artifacts'].values():
                store.heartbeat()
                drive.trash(artifact['id'])  # Reversible Drive trash; never permanent delete.
            manifest['retired'] = True
            manifest['retired_at'] = now.isoformat()
            manifest.pop('retention_in_progress', None)
            store.save(manifest)
        return len(requested)
