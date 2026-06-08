# Karan Rajendra Portfolio

A responsive software and machine learning engineering portfolio with a profile-only generative AI assistant.

## Run locally

```powershell
python -m pip install -r requirements.txt
$env:OPENAI_API_KEY="your_server_side_api_key"
python rag_service.py
```

Open `http://127.0.0.1:8000`.

The Python service hosts both the static portfolio and the local RAG API:

- `GET /api/health`
- `POST /api/query` with `{ "query": "What machine learning systems has Karan built?" }`

When `OPENAI_API_KEY` is configured, the backend uses a real language model to understand each question and generate natural answers from Karan's complete verified portfolio background. Unsupported or unrelated questions are rejected before model generation.

The API key must remain server-side. A static GitHub Pages deployment cannot securely provide the real GenAI endpoint by itself. The included `render.yaml` can deploy the full portfolio and Python backend together; configure `OPENAI_API_KEY` as a secret environment variable on the host.

## Test

```powershell
python -m unittest -v
```

Without the backend or API key, the frontend gracefully falls back to grounded local answers.
