import json
import tempfile
import unittest
from pathlib import Path

from storage import read_journal, sanitize_filename, write_journal


class StorageTests(unittest.TestCase):
    def test_sanitize_filename_removes_path_and_unsafe_characters(self):
        self.assertEqual(sanitize_filename("../../private voice?.mp3"), "private_voice_.mp3")

    def test_read_missing_journal_returns_empty_list(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(read_journal(Path(directory) / "journal.json"), [])

    def test_write_journal_replaces_file_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "journal.json"
            entries = [{"emotion": "calm", "note": "A useful reflection"}]
            write_journal(path, entries)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), entries)
            self.assertFalse(path.with_suffix(".tmp").exists())


if __name__ == "__main__":
    unittest.main()
