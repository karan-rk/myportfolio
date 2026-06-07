import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / os.getenv("MODEL_DIR", "model")
DATA_DIR = BASE_DIR / os.getenv("DATA_DIR", "runtime_data")
AUDIO_DIR = DATA_DIR / "audio"
JOURNAL_FILE = DATA_DIR / "journal.json"
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(15 * 1024 * 1024)))
ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/flac",
    "audio/x-m4a",
    "audio/mp4",
    "audio/webm",
    "audio/ogg",
}
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3002,http://127.0.0.1:3003",
    ).split(",")
    if origin.strip()
]
