# Karan Rajendra — Portfolio

Personal portfolio site with an integrated AI assistant (Portfolio AI) that answers recruiter questions about experience, projects, skills, and role fit using a retrieval-based system backed by verified portfolio content.

**Live site:** https://karan-rk.github.io/myportfolio/  
**Backend API:** https://karan-portfolio-ai.onrender.com

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  GitHub Pages (static frontend)                     │
│  index.html + styles.css + js/ + projects/ + assets/│
└────────────────────┬────────────────────────────────┘
                     │ fetch() to /api/query, /api/health
                     ▼
┌─────────────────────────────────────────────────────┐
│  Render (Python backend — free tier)                │
│  backend/rag_service.py — Flask + retrieval engine  │
│  backend/data/portfolio_content.json — knowledge    │
└─────────────────────────────────────────────────────┘
```

The frontend is a static site hosted on GitHub Pages. The Portfolio AI backend is a Python Flask service deployed on Render's free tier. The two communicate via `fetch()` calls from the browser to the Render API. The backend URL is configured via a `<meta name="portfolio-api-url">` tag in `index.html` — no hardcoded URLs in JavaScript.

---

## Repository structure

```
myportfolio/
├── index.html                    # Main portfolio page
├── styles.css                    # All styles (minified + override block at end)
├── site.webmanifest              # PWA manifest
├── render.yaml                   # Render deployment config
│
├── js/                           # Modular JavaScript (load order matters)
│   ├── theme.js                  # Dark/light theme toggle
│   ├── nav.js                    # Mobile nav, scroll behavior
│   ├── hero.js                   # Hero counter animations, scroll reveals
│   ├── skills.js                 # Skill chip tooltips
│   ├── projects.js               # Case study expand/collapse, modal
│   ├── ai-chat.js                # Portfolio AI — all RAG chat logic
│   └── cursor.js                 # Cursor spotlight on dark sections
│
├── backend/                      # Portfolio AI backend (deployed to Render)
│   ├── rag_service.py            # Flask app + retrieval engine (main entry point)
│   ├── requirements.txt          # Python dependencies
│   ├── test_rag_service.py       # 21-scenario evaluation suite
│   ├── .env.example              # Environment variable template
│   └── data/
│       └── portfolio_content.json  # Knowledge base (38 entries)
│
├── assets/                       # Images, PDFs, brand logos, icons
├── projects/                     # Per-project architecture pages and live demos
│   ├── aws-three-tier/
│   ├── counterparty-risk/
│   ├── eks-gitops/
│   ├── portfolio-ai/
│   ├── resume-job-match/
│   └── speech-emotion-detection/
└── data/                         # (legacy placeholder — content moved to backend/data/)
```

---

## Backend — `backend/`

The backend is a self-contained Python package. All paths resolve relative to `rag_service.py`, so it works correctly whether run locally or deployed on Render.

```python
ROOT = Path(__file__).resolve().parent
# → resolves to backend/ in both environments
# → finds backend/data/portfolio_content.json automatically
```

### Key files

| File | Purpose |
|------|--------|
| `rag_service.py` | Flask app with `/api/health`, `/api/query`, `/api/evaluation` endpoints |
| `requirements.txt` | Pinned Python dependencies |
| `data/portfolio_content.json` | 38-entry knowledge base (schema_version 1) |
| `test_rag_service.py` | Unit tests + 21-scenario evaluation suite |
| `.env.example` | Template for `OPENAI_API_KEY` and other env vars |

### API endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Returns `{status, genai, documents, chunks}`. `genai: false` means no OpenAI key is configured — offline retrieval only. |
| `/api/query` | POST | Accepts `{query, role, answer_mode, history}`. Returns answer with citations and retrieval trace. |
| `/api/evaluation` | GET | Runs the 21-scenario evaluation suite and returns pass/fail metrics. |

---

## Render deployment

The backend is deployed on Render using the `render.yaml` configuration at the repo root.

### Why `rootDir: backend`

`render.yaml` sets `rootDir: backend` for the `karan-portfolio-ai` service. This tells Render to treat `backend/` as the working directory before running any build or start commands. Without it, Render would look for `requirements.txt` and `rag_service.py` at the repo root (where they do not exist after the restructure), and the deploy would fail.

```yaml
# render.yaml
services:
  - type: web
    name: karan-portfolio-ai
    runtime: python
    rootDir: backend          # <-- Render sets CWD to backend/ before build/start
    buildCommand: pip install -r requirements.txt
    startCommand: python rag_service.py
```

### Configuring the OpenAI API key

The Portfolio AI works in offline mode without an API key (retrieval only). To enable the GPT-4.1-mini generative enhancement:

1. Go to the Render dashboard → `karan-portfolio-ai` service → **Environment**
2. Add a new environment variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** your OpenAI API key (starts with `sk-`)
3. Save — Render will redeploy automatically
4. Verify: `GET https://karan-portfolio-ai.onrender.com/api/health` should return `"genai": true`

Without this key, the `/api/health` endpoint returns `"genai": false` and all answers come from the offline retrieval path. The portfolio still works — answers are evidence-backed but not GPT-enhanced.

### Cold start

Render free-tier services spin down after ~15 minutes of inactivity. The first request after a cold start takes approximately 25–35 seconds. The Portfolio AI frontend handles this with a warm-up notice that appears after 5 seconds if the health check has not yet resolved.

---

## GitHub Pages deployment

The frontend is served from the `main` branch root via GitHub Pages.

- **Settings → Pages → Source:** Deploy from branch `main`, folder `/` (root)
- All HTML, CSS, JS, and assets at the repo root are served directly
- No build step required — the site is plain HTML/CSS/JS

To deploy a change: merge the feature branch into `main`. GitHub Pages auto-deploys within ~30 seconds.

---

## Portfolio AI — RAG architecture

The Portfolio AI uses a retrieval system (not a simple keyword search) to answer recruiter questions.

```
Question → normalize + typo-correct → expand query terms
         → score all 38 knowledge chunks by relevance
         → apply confidence gate (threshold check)
         → if confidence high enough: cite top passages + generate answer
         → if confidence too low: abstain ("I don't have that information")
         → return answer + citations + retrieval trace + follow-up suggestions
```

Key design decisions:

**Offline-first reliability.** The system answers from retrieved evidence even when the OpenAI API key is not configured. The generative path (GPT-4.1-mini) enhances answers when available but is never required.

**Confidence gate.** Every answer goes through a scored threshold check. If the top retrieved passage does not clear the minimum relevance score, the assistant abstains rather than inventing an answer. This prevents hallucination.

**Typo correction.** Common misspellings and shorthand are normalized before retrieval (e.g., "Meta SE" → "Meta Software Engineer").

**Role-aware ranking.** Queries tagged with a target role (ML Engineer, Data Scientist, Software Engineer) reweight retrieved passages to surface the most relevant evidence for that role.

**Conversation context.** Follow-up questions are resolved against the previous turn so "why did you choose that?" after a project question correctly expands to the full project context.

**21-scenario evaluation suite.** `test_rag_service.py` runs a full evaluation on every deploy. Metrics: top evidence accuracy, citation coverage (must be 100%), abstention accuracy (must be 100%), role ranking accuracy (must be 100%), average latency.

---

## Local development

### Frontend only

The frontend is static — open `index.html` in a browser or use any static file server:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

When running locally, `ai-chat.js` detects `localhost` and routes API calls to `""` (empty base URL), which means it expects the backend at the same origin. For local frontend-only development, the Portfolio AI will show "Demo" status (offline mode) — this is expected.

### Backend only

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: configure OpenAI API key
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-...

python rag_service.py
# → Serving on http://localhost:5000
```

### Full local stack

Run the backend on port 5000 and serve the frontend on port 8000. The frontend will call the Render API URL from the `<meta>` tag (not localhost), so for full local integration you would need to temporarily update the `portfolio-api-url` meta tag in `index.html` to `http://localhost:5000`.

### Running tests

```bash
cd backend
python -m pytest test_rag_service.py -v
# or
python test_rag_service.py
```

The test suite runs the full 21-scenario evaluation and unit tests for retrieval, follow-up suggestions, typo correction, and abstention behavior.

---

## Troubleshooting

**Portfolio AI shows "Demo" status**  
The backend is offline or the health check failed. This is expected on cold start — wait ~35 seconds and refresh. If it persists, check the Render dashboard for deployment errors.

**Portfolio AI answers seem outdated**  
The knowledge base (`backend/data/portfolio_content.json`) may be stale. Check that the latest branch has been merged into `main` and that Render has redeployed. The live health check at `/api/health` shows `chunks` — if it shows fewer than 38, the old version is still running.

**`genai: false` on the health check**  
The `OPENAI_API_KEY` environment variable is not set in Render. See [Configuring the OpenAI API key](#configuring-the-openai-api-key) above.

**Render deploy fails with "requirements.txt not found"**  
Verify that `render.yaml` has `rootDir: backend`. Without this, Render looks for `requirements.txt` at the repo root.

**CSS changes not visible after deploy**  
The stylesheet uses a version query string (`styles.css?v=46`). Increment the version number in `index.html` when making CSS changes so browsers fetch the updated file.

**Local backend `ImportError` or `ModuleNotFoundError`**  
Run `pip install -r requirements.txt` inside the `backend/` directory, not the repo root. The backend dependencies are scoped to `backend/requirements.txt`.
