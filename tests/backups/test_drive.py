"""Drive adapter contract tests: mocked HTTP requests, no live credentials."""
import unittest
from unittest.mock import MagicMock

from googleapiclient.errors import HttpError
from httplib2 import Response

from backups.storage import Drive, FOLDER


class DriveAdapterTests(unittest.TestCase):
    def setUp(self):
        self.service = MagicMock()
        self.files = self.service.files.return_value
        self.drive = Drive(self.service)

    def test_generated_ids_saved_as_regular_drive_file_ids(self):
        self.files.generateIds.return_value.execute.return_value = {'ids': ['reserved']}
        self.assertEqual(self.drive.new_id(), 'reserved')
        self.files.generateIds.assert_called_once_with(count=1, space='drive', type='files')

    def test_get_distinguishes_missing_from_denied_access(self):
        request = self.files.get.return_value
        request.execute.side_effect = HttpError(Response({'status': '404'}), b'{}')
        self.assertIsNone(self.drive.get('id'))
        request.execute.side_effect = HttpError(Response({'status': '403'}), b'{}')
        with self.assertRaises(HttpError):
            self.drive.get('id')

    def test_folder_search_handles_pagination_and_shared_drives(self):
        self.files.list.return_value.execute.side_effect = [
            {'files': [{'id': 'a'}], 'nextPageToken': 'next'}, {'files': [{'id': 'b'}]}]
        self.assertEqual(self.drive.folders('parent', 'October'), [{'id': 'a'}, {'id': 'b'}])
        self.assertEqual(self.files.list.call_count, 2)
        self.assertTrue(self.files.list.call_args.kwargs['supportsAllDrives'])
        self.assertEqual(self.files.list.call_args.kwargs['pageToken'], 'next')

    def test_folder_creation_and_resumable_upload_use_planned_ids(self):
        self.drive.create_folder('folder-id', 'parent-id', 'October')
        body = self.files.create.call_args.kwargs['body']
        self.assertEqual(body['id'], 'folder-id')
        self.assertEqual(body['mimeType'], FOLDER)
        self.files.create.return_value.next_chunk.side_effect = [(None, None), (None, {'id': 'planned'})]
        result = self.drive.upload('planned', 'parent-id', 'test.xlsx', b'content', {'week': 'date'})
        self.assertEqual(result['id'], 'planned')
        self.assertEqual(self.files.create.call_args.kwargs['body']['id'], 'planned')
        self.assertEqual(self.files.create.return_value.next_chunk.call_count, 2)

    def test_retention_only_moves_to_trash(self):
        self.drive.trash('approved-id')
        self.assertEqual(self.files.update.call_args.kwargs['body'], {'trashed': True})
        self.files.delete.assert_not_called()


if __name__ == '__main__':
    unittest.main()
