# Portfolio Assistant Content

`portfolio_content.json` is the canonical source of verified facts used by Karan AI.

## Updating content

Edit an existing entry when a fact changes. Add a new focused entry when a project, role, result, or capability needs its own answer context.

Each entry requires:

- `id`: stable unique identifier used by retrieval tests and role ranking
- `target`: matching section id in `index.html` so citations can navigate to the evidence
- `source`: one of `Resume`, `Experience`, `Projects`, `Architecture`, or `Skills`
- `title`: natural title shown in citations and answers
- `summary`: one-sentence answer lead
- `content`: verified details, methods, technologies, and measurable results
- `keywords`: likely recruiter and visitor wording

Keep entries factual and focused. Do not add facts that are not supported by the resume, portfolio, or project artifacts. Terms used in titles, content, and keywords also become the assistant's known vocabulary for conservative typo correction, so include important technology and project names using their correct spelling.

Run `python -m unittest -v test_rag_service.py` after every content update.
