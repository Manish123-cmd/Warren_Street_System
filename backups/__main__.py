"""Run with python -m backups. Credentials are read only from the environment."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import sys
import time

import google.auth
from google.oauth2 import credentials, service_account
from googleapiclient.discovery import build
from pymongo import MongoClient
from pymongo.write_concern import WriteConcern

from .core import UTC, config_sources, reporting_week
from .runner import apply_retention, backup, retention_plan
from .storage import Drive, MongoStore


def required(name):
    value = os.environ.get(name, '').strip()
    if not value:
        raise ValueError('Missing configuration: ' + name)
    return value


def drive_client():
    scopes = ['https://www.googleapis.com/auth/drive']
    raw = os.environ.get('GOOGLE_DRIVE_CREDENTIALS_JSON')
    if raw:
        info = json.loads(raw)
        if info.get('type') == 'authorized_user':
            auth = credentials.Credentials.from_authorized_user_info(info, scopes=scopes)
        elif info.get('type') == 'service_account':
            auth = service_account.Credentials.from_service_account_info(info, scopes=scopes)
        else:
            raise ValueError('Unsupported Google credential type')
    else:
        auth, _ = google.auth.default(scopes=scopes)
    return Drive(build('drive', 'v3', credentials=auth, cache_discovery=False))


def main():
    parser = argparse.ArgumentParser(description='Four weekly Excel backups to Google Drive')
    parser.add_argument('--week', help='Completed reporting week starting Monday, YYYY-MM-DD')
    parser.add_argument('--attempts', type=int, default=3)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--retention-plan', type=Path, help='Write a proposal only; never deletes files')
    group.add_argument('--approve-retention', type=Path, help='Explicit operator approval to trash exactly the files in this reviewed plan')
    args = parser.parse_args()
    now = datetime.now(UTC)
    try:
        if not 1 <= args.attempts <= 5:
            raise ValueError('Attempts must be between 1 and 5')
        # Validate dates before touching external services.
        reporting_week(now, args.week)
        manifest_collection = os.environ.get('BACKUP_MANIFEST_COLLECTION', 'weekly_backup_manifests')
        sources = config_sources(required('BACKUP_SOURCES_JSON'), manifest_collection)
        parent = required('GOOGLE_DRIVE_PARENT_FOLDER_ID')
        retention_days = int(os.environ.get('BACKUP_RETENTION_DAYS', '0'))
        if retention_days < 0:
            raise ValueError('Retention days must be nonnegative')
        with MongoClient(required('MONGODB_URI'), tz_aware=True, serverSelectionTimeoutMS=15000,
                         connectTimeoutMS=15000, socketTimeoutMS=120000) as client:
            database = client.get_database(required('MONGODB_DATABASE'), write_concern=WriteConcern(w='majority'))
            client.admin.command('ping')
            store = MongoStore(database, manifest_collection)
            if args.retention_plan:
                with store.lock():
                    plan = retention_plan(store, retention_days, now, parent)
                args.retention_plan.write_text(json.dumps(plan, indent=2), encoding='utf-8')
                print('Retention proposal written; no files changed.')
                return 0
            drive = drive_client()
            if args.approve_retention:
                count = apply_retention(store, drive, json.loads(args.approve_retention.read_text(encoding='utf-8')),
                                        retention_days, now, parent)
                print(f'Explicit retention approval processed: {count} backup sets moved to Drive trash.')
                return 0
            for attempt in range(args.attempts):
                try:
                    manifest = backup(store, drive, sources, parent, now, args.week)
                    print(f"Backup verified: {manifest['week_start']} to {manifest['week_end']}; four workbooks, timestamp {manifest['timestamp']}.")
                    return 0
                except Exception as error:
                    print(f'Backup attempt {attempt + 1} failed ({type(error).__name__}); credentials and records omitted.', file=sys.stderr)
                    if attempt + 1 < args.attempts:
                        time.sleep(min(5 * 2 ** attempt, 30))
            return 1
    except Exception as error:
        print(f'Backup configuration or connection failed ({type(error).__name__}). Check private configuration and permissions.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
