import json
import re
from pathlib import Path


SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename(filename):
    clean_name = SAFE_FILENAME.sub("_", Path(filename or "audio.mp3").name)
    return clean_name[:120] or "audio.mp3"


def read_journal(path):
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as journal_file:
        return json.load(journal_file)


def write_journal(path, entries):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(".tmp")
    with temporary_path.open("w", encoding="utf-8") as journal_file:
        json.dump(entries, journal_file, indent=2)
    temporary_path.replace(path)
