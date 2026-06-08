# Speech Emotion Detection for Mental Health Reflection

A full-stack prototype that predicts emotion from speech and stores audio-backed journal entries. It supports recording, audio upload, confidence scoring, playback, and editable reflections.

This prototype is not a medical or diagnostic tool. Audio and journal data are sensitive; deploy only with appropriate privacy, retention, authentication, and encryption controls.

## Architecture

- Model: Conv1D + Bidirectional LSTM + Attention
- Features: ZCR, chroma, MFCC, RMS, and mel spectrogram
- API: FastAPI
- Product UI: React
- Training data: RAVDESS, CREMA-D, TESS, and SAVEE

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

Environment variables:

- `CORS_ORIGINS`: comma-separated frontend origins
- `MAX_UPLOAD_BYTES`: maximum accepted upload size
- `DATA_DIR`: journal and audio storage directory
- `MODEL_DIR`: trained model directory

## Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm start
```

Set `REACT_APP_API_BASE_URL` to the backend URL.

Microphone recording works only from HTTPS or localhost. Permission is requested when the microphone button is pressed. If access was previously denied, allow microphone access from the browser's site settings and press the microphone again.

The public portfolio build lives at `projects/speech-emotion-detection/live/` and calls `https://karan-speech-emotion-api.onrender.com`. It performs prediction only and does not save visitor audio or expose the shared journal.

Deploy the `karan-speech-emotion-api` service from the repository's `render.yaml` Blueprint before using the public demo. The live interface displays whether the inference service is ready.

## Tests

```powershell
cd backend
python -m unittest -v test_storage.py

cd ..\frontend
npm test -- --watchAll=false
```
