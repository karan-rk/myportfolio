# Karan Rajendra Portfolio

A responsive ML engineering portfolio with an interactive, citation-first RAG project.

## Run locally

```powershell
python -m pip install -r requirements.txt
python rag_service.py
```

Open `http://127.0.0.1:8000`.

The Python service hosts both the static portfolio and the local RAG API:

- `GET /api/health`
- `POST /api/query` with `{ "query": "How is answer quality evaluated?" }`

## Test

```powershell
python -m unittest -v
```

The frontend gracefully falls back to a simulated demo when opened without the Python API.
