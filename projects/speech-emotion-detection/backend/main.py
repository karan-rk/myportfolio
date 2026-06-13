# backend/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import io
import joblib
import os
import logging
from keras.models import load_model
from datetime import datetime
from fastapi.logger import logger
import json
from pathlib import Path
from uuid import uuid4

# Limit TF CPU parallelism to reduce memory pressure on free-tier hosts
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
try:
    import tensorflow as tf
    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.config.threading.set_inter_op_parallelism_threads(1)
except Exception:
    pass

from config import (
    ALLOWED_AUDIO_TYPES,
    AUDIO_DIR,
    CORS_ORIGINS,
    JOURNAL_FILE,
    MAX_UPLOAD_BYTES,
    MODEL_DIR,
)
from storage import read_journal, sanitize_filename, write_journal

# Initialize FastAPI app
app = FastAPI(
    title="Speech Emotion Detection API",
    description="Audio emotion inference and private local journaling API.",
    version="1.0.0",
)

# Open CORS — portfolio demo does not use credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model": "speech-emotion-detection"}

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths to model and preprocessing objects
MODEL_PATH = MODEL_DIR / "speech_emotion_recognition_model.h5"
SCALER_PATH = MODEL_DIR / "scaler.save"
ENCODER_PATH = MODEL_DIR / "encoder.save"

# Check if all required files exist
for path in [MODEL_PATH, SCALER_PATH, ENCODER_PATH]:
    if not os.path.exists(path):
        logger.error(f"Required file not found: {path}")
        raise FileNotFoundError(f"Required file not found: {path}")

# Load the scaler
try:
    scaler = joblib.load(SCALER_PATH)
    logger.info("Scaler loaded successfully.")
except Exception as e:
    logger.error(f"Error loading scaler: {e}")
    raise e

# Load the encoder
try:
    encoder = joblib.load(ENCODER_PATH)
    logger.info("Encoder loaded successfully.")
except Exception as e:
    logger.error(f"Error loading encoder: {e}")
    raise e

# Load the trained model
try:
    model = load_model(MODEL_PATH, compile=False)
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise e

# Retrieve emotion labels from encoder
try:
    emotion_labels = encoder.categories_[0].tolist()
    logger.info(f"Emotion labels: {emotion_labels}")
except Exception as e:
    logger.error(f"Error retrieving emotion labels from encoder: {e}")
    raise e

def extract_features(data, sample_rate):
    try:
        zcr = np.mean(librosa.feature.zero_crossing_rate(y=data).T, axis=0)
        stft = np.abs(librosa.stft(data))
        chroma_stft = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
        mfcc = np.mean(librosa.feature.mfcc(y=data, sr=sample_rate).T, axis=0)
        rms = np.mean(librosa.feature.rms(y=data).T, axis=0)
        mel = np.mean(librosa.feature.melspectrogram(y=data, sr=sample_rate).T, axis=0)
        return np.hstack((zcr, chroma_stft, mfcc, rms, mel))
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        raise e


def predict_audio(contents):
    """Run CPU-heavy audio processing outside the async request loop."""
    file_like = io.BytesIO(contents)
    try:
        audio_data, sample_rate = librosa.load(file_like, sr=None, duration=5.0)
    except Exception as e:
        logger.error(f"Error loading audio file: {e}")
        raise HTTPException(status_code=400, detail="Failed to load audio file. Ensure the file is valid.")

    if len(audio_data) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty or invalid.")

    features = extract_features(audio_data, sample_rate)
    features_scaled = scaler.transform([features])
    features_scaled = np.expand_dims(features_scaled, axis=2)
    input_shape = model.input_shape[1:]
    if features_scaled.shape[1:] != input_shape:
        raise HTTPException(status_code=500, detail="Incompatible feature shape.")

    prediction = model.predict(features_scaled, verbose=0)
    predicted_index = int(np.argmax(prediction[0]))
    predicted_class = emotion_labels[predicted_index]
    confidence = float(prediction[0][predicted_index])
    logger.info(f"Prediction: {predicted_class} ({confidence:.2f})")
    return {"emotion": predicted_class, "confidence": confidence}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Supported: .wav, .mp3, .flac, .m4a, .webm, .ogg")
    try:
        contents = await file.read()
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_UPLOAD_BYTES // (1024*1024)}MB.")
        return await run_in_threadpool(predict_audio, contents)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the file.")


@app.post("/journal")
async def save_journal_entry(
    file: UploadFile = File(...),
    emotion: str = Form("unknown"),
    note: str = Form("")
):
    try:
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{uuid4().hex[:8]}_{sanitize_filename(file.filename)}"
        audio_path = AUDIO_DIR / unique_filename
        with audio_path.open("wb") as f:
            f.write(await file.read())
        journal = read_journal(JOURNAL_FILE)
        journal.append({"audio_file": unique_filename, "emotion": emotion, "note": note, "date": datetime.strptime(timestamp, "%Y%m%d%H%M%S").strftime("%Y-%m-%d %H:%M:%S")})
        write_journal(JOURNAL_FILE, journal)
        return {"message": "Journal entry saved successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving journal entry: {e}")
        raise HTTPException(status_code=500, detail="Failed to save journal entry.")


@app.get("/journal")
async def get_journal_entries():
    try:
        return read_journal(JOURNAL_FILE)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch journal entries.")


from fastapi.responses import FileResponse

@app.get("/audio/{filename}")
async def get_audio_file(filename: str):
    audio_path = (AUDIO_DIR / sanitize_filename(filename)).resolve()
    if AUDIO_DIR.resolve() not in audio_path.parents or not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")


from pydantic import BaseModel

class UpdateNoteRequest(BaseModel):
    note: str

@app.put("/journal/{index}")
async def update_journal_entry(index: int, request: UpdateNoteRequest):
    try:
        if not JOURNAL_FILE.exists():
            raise HTTPException(status_code=404, detail="Journal file not found.")
        journal = read_journal(JOURNAL_FILE)
        if index < 0 or index >= len(journal):
            raise HTTPException(status_code=404, detail="Invalid journal entry index.")
        journal[index]["note"] = request.note.strip()[:2000]
        write_journal(JOURNAL_FILE, journal)
        return {"message": "Journal entry updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update journal entry.")
