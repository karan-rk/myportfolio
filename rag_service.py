import json
import base64
import io
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
KNOWLEDGE_PATH = ROOT / "data" / "knowledge_base.json"
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "best", "by", "do", "does", "for", "from",
    "has", "have", "he", "how", "i", "in", "is", "it", "karan", "know", "of", "on", "or", "the",
    "s", "this", "to", "what", "where", "will", "with",
}
MAX_PDF_BYTES = 5 * 1024 * 1024
MAX_REQUEST_BYTES = 7 * 1024 * 1024
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
ANSWER_MODES = {"short", "detailed", "bullets"}
TOKEN_ALIASES = {
    "located": "location", "relocate": "relocation", "relocating": "relocation",
    "projects": "project", "skills": "skill", "technologies": "technology",
}
ROLE_PROFILES = {
    "general": {"label": "General", "boosts": {}},
    "ml-engineer": {
        "label": "ML Engineer",
        "boosts": {"skills-toolkit": 2.5, "skills-platform": 2.2, "experience-research-methods": 2.2, "projects-sentinel": 2.0, "projects-speech": 2.0},
    },
    "data-scientist": {
        "label": "Data Scientist",
        "boosts": {"projects-sentinel": 3.5, "skills-data-ml": 1.8, "experience-meta": 2.1, "experience-research-methods": 2.0, "skills-toolkit": 1.6},
    },
    "software-engineer": {
        "label": "Software Engineer",
        "boosts": {"experience-meta": 2.8, "experience-systems-research": 2.2, "skills-toolkit": 2.0, "projects-cloud-infrastructure": 2.0, "projects-rolefit-rag": 1.8, "projects-speech": 1.6},
    },
}
EVALUATION_CASES = [
    {"name": "Professional introduction", "query": "Tell me about yourself", "role": "general", "expected": "resume-summary"},
    {"name": "Meta impact", "query": "What impact did Karan have at Meta?", "role": "general", "expected": "experience-meta"},
    {"name": "Biggest achievement", "query": "What is Karan's biggest professional achievement?", "role": "general", "expected": "experience-meta"},
    {"name": "Collaboration", "query": "Does Karan have cross-functional collaboration experience?", "role": "general", "expected": "experience-meta-product"},
    {"name": "Research experience", "query": "What machine learning research has Karan done?", "role": "general", "expected": "experience-research-methods"},
    {"name": "Leadership", "query": "What leadership and communication experience does Karan have?", "role": "general", "expected": "experience-teaching"},
    {"name": "NLP projects", "query": "Which projects demonstrate NLP and applied machine learning?", "role": "general", "expected_prefix": "projects-"},
    {"name": "Technical skills", "query": "What skills make Karan a strong fit?", "role": "general", "expected": "skills-toolkit"},
    {"name": "Backend and cloud", "query": "Does Karan have backend, cloud, and deployment experience?", "role": "general", "expected": "skills-platform"},
    {"name": "Education", "query": "What is Karan's education?", "role": "general", "expected": "resume-education"},
    {"name": "Availability", "query": "Where is Karan located and is he open to relocation?", "role": "general", "expected": "resume-availability"},
    {"name": "Data Scientist fit", "query": "Why is Karan a strong candidate?", "role": "data-scientist", "expected": "projects-sentinel"},
    {"name": "Software Engineer fit", "query": "Why is Karan a strong candidate?", "role": "software-engineer", "expected": "experience-meta"},
    {"name": "Unknown visa status", "query": "What is Karan's current visa status?", "role": "general", "abstain": True},
    {"name": "Unsupported question", "query": "What is the best recipe for chocolate cake?", "role": "general", "abstain": True},
]

QUERY_EXPANSIONS = (
    (("tell me about yourself", "introduce yourself", "walk me through your background"), "professional summary profile production research teaching projects"),
    (("why should we hire", "why hire", "strong candidate", "good fit"), "candidate fit skills measurable impact production research projects"),
    (("biggest achievement", "biggest professional achievement", "greatest achievement", "most impressive"), "meta instagram measurable impact production scale 5x"),
    (("leadership", "mentor", "communication", "explain technical"), "teaching mentorship graduate students communication"),
    (("teamwork", "collaboration", "cross-functional", "stakeholder"), "cross functional product decisions experiments collaboration"),
    (("backend", "deployment", "cloud", "productionize"), "backend data platform deployment rest api docker cloud mlops"),
    (("located", "location", "relocate", "availability", "available"), "new york availability open relocation"),
    (("education", "degree", "coursework", "graduation"), "education masters gpa coursework stony brook"),
)
SUPPORTED_BROAD_PHRASES = (
    "tell me about yourself", "introduce yourself", "walk me through your background",
    "why should we hire", "why hire", "strong candidate", "good fit",
    "biggest achievement", "biggest professional achievement", "greatest achievement", "most impressive",
)
PROFILE_SCOPE_TERMS = (
    "karan", "he", "his", "him", "yourself", "candidate", "hire", "fit", "profile",
    "experience", "work", "project", "skill", "education", "degree", "research",
    "software", "engineering", "machine learning", "ml", "ai", "backend", "data",
    "cloud", "meta", "instagram", "stony brook", "availability", "location",
)
UNSUPPORTED_PERSONAL_TOPICS = (
    "weakness", "failure", "conflict", "mistake", "salary", "compensation", "visa",
    "work authorization", "sponsorship", "start date",
)
GENERIC_QUERY_TOKENS = {
    "available", "availability", "background", "built", "candidate", "communication", "coursework",
    "degree", "education", "experience", "fit", "leadership", "opportunity", "profile", "project",
    "make", "qualified", "skill", "strong", "suitable", "summary", "teamwork", "technology", "tool",
}


def tokenize(text):
    return [TOKEN_ALIASES.get(token, token) for token in TOKEN_PATTERN.findall(text.lower()) if token not in STOP_WORDS]


def expand_query(query):
    normalized = query.lower()
    additions = [expansion for phrases, expansion in QUERY_EXPANSIONS if any(phrase in normalized for phrase in phrases)]
    return f"{query} {' '.join(additions)}".strip()


with KNOWLEDGE_PATH.open(encoding="utf-8") as knowledge_file:
    CHUNKS = json.load(knowledge_file)


def score_chunk(query, chunk, role="general"):
    normalized_query = query.lower()
    query_tokens = tokenize(query)
    document_tokens = tokenize(f"{chunk['title']} {chunk['content']} {' '.join(chunk['keywords'])}")
    query_counts = Counter(query_tokens)
    document_counts = Counter(document_tokens)
    overlap = sum(min(count, document_counts[token]) for token, count in query_counts.items())
    lexical_score = overlap / max(len(query_tokens), 1)
    query_set, document_set = set(query_tokens), set(document_tokens)
    semantic_score = len(query_set & document_set) / math.sqrt(max(len(query_set) * len(document_set), 1))
    keyword_score = sum(1 for keyword in chunk["keywords"] if keyword in normalized_query) * 0.35
    intent_score = 0
    if any(term in normalized_query for term in ("meta", "instagram", "impact", "experience", "production")) and chunk["source"] == "Experience":
        intent_score += 0.55
    if any(term in normalized_query for term in ("project", "built", "portfolio", "nlp", "speech", "risk")) and chunk["source"] == "Projects":
        intent_score += 0.45
    if any(term in normalized_query for term in ("skill", "technology", "stack", "tool", "qualified", "fit")) and chunk["source"] == "Skills":
        intent_score += 1.5
    if any(term in normalized_query for term in ("education", "degree", "gpa", "candidate", "profile")) and chunk["source"] == "Resume":
        intent_score += 0.45
    if any(term in normalized_query for term in ("nlp", "natural language", "language model")):
        intent_score += {"experience-research": 0.75, "projects-rolefit-rag": 0.55}.get(chunk["id"], 0)
    if any(term in normalized_query for term in ("biggest achievement", "biggest professional achievement", "greatest achievement", "most impressive")):
        intent_score += 1.0 if chunk["id"] == "experience-meta" else 0
    fit_query = any(term in normalized_query for term in ("candidate", "fit", "qualified", "strong", "hire", "suitable"))
    if role == "general" and any(term in normalized_query for term in ("why should we hire", "why hire")):
        intent_score += {"experience-meta": 1.5, "experience-research": 0.8, "resume-summary": 0.6}.get(chunk["id"], 0)
    role_weight = 1 if fit_query else 0.15
    role_score = ROLE_PROFILES.get(role, ROLE_PROFILES["general"])["boosts"].get(chunk["id"], 0) * role_weight
    return lexical_score + semantic_score + keyword_score + intent_score + role_score


def retrieve(query, limit=3, role="general"):
    query = expand_query(query)
    ranked = sorted(
        ({**chunk, "score": round(score_chunk(query, chunk, role), 3)} for chunk in CHUNKS),
        key=lambda chunk: chunk["score"],
        reverse=True,
    )
    return ranked[:limit]


def chunk_tokens(chunk):
    return set(tokenize(f"{chunk['title']} {chunk['content']} {' '.join(chunk['keywords'])}"))


def specific_query_tokens(query):
    return set(tokenize(query)) - GENERIC_QUERY_TOKENS


def question_is_supported(query, passages):
    normalized = query.lower()
    if any(topic in normalized for topic in UNSUPPORTED_PERSONAL_TOPICS):
        return False
    if any(phrase in normalized for phrase in SUPPORTED_BROAD_PHRASES):
        return True
    if not any(re.search(rf"\b{re.escape(term)}\b", normalized) for term in PROFILE_SCOPE_TERMS):
        return False
    query_tokens = set(tokenize(query))
    specific_tokens = specific_query_tokens(query)
    tokens_to_match = specific_tokens or query_tokens
    return bool(tokens_to_match and any(tokens_to_match & chunk_tokens(passage) for passage in passages))


def select_answer_passages(query, passages):
    intent = detect_intent(query)
    query_tokens = set(tokenize(query))
    specific_tokens = specific_query_tokens(query)
    source_by_intent = {"Projects": "Projects", "Skills": "Skills", "Education": "Resume", "Availability": "Resume"}
    selected = []
    for passage in passages:
        direct_match = bool(query_tokens & chunk_tokens(passage))
        category_match = not specific_tokens and source_by_intent.get(intent) == passage["source"]
        source_matches_intent = not source_by_intent.get(intent) or passage["source"] == source_by_intent[intent]
        if source_matches_intent and (direct_match or category_match or (intent == "Profile" and passage["id"] == "resume-summary")):
            selected.append(passage)
    return selected[:3] or passages[:1]


def detect_intent(query):
    normalized = query.lower()
    if any(term in normalized for term in ("available", "availability", "location", "located", "relocation", "visa", "work authorization", "salary")):
        return "Availability"
    if any(term in normalized for term in ("leadership", "mentor", "communication", "teaching", "collaboration", "teamwork")):
        return "Leadership"
    if any(term in normalized for term in ("education", "degree", "gpa", "coursework", "graduation")):
        return "Education"
    if any(term in normalized for term in ("meta", "instagram", "experience", "impact", "production")):
        return "Experience"
    if any(term in normalized for term in ("project", "built", "nlp", "speech", "risk", "rag")):
        return "Projects"
    if any(term in normalized for term in ("skill", "technology", "stack", "tool", "qualified", "fit")):
        return "Skills"
    if any(term in normalized for term in ("candidate", "profile", "yourself", "background", "introduce")):
        return "Profile"
    return "General"


def contextualize_query(query, history):
    if not history:
        return query, False
    normalized = query.lower()
    follow_up_terms = ("that", "there", "those", "it", "he", "his", "more", "relevant", "compare")
    is_follow_up = len(tokenize(query)) <= 6 or any(term in tokenize(normalized) for term in follow_up_terms)
    if not is_follow_up:
        return query, False
    previous = history[-1]
    context = " ".join(
        part for part in (
            str(previous.get("question", "")).strip(),
            str(previous.get("topic", "")).strip(),
        ) if part
    )
    return f"{query} Context: {context}".strip(), True


def follow_up_suggestions(intent):
    return {
        "Experience": ["Which skills did he use there?", "How is that relevant to the selected role?"],
        "Projects": ["Which project is most relevant to this role?", "What measurable results did those projects achieve?"],
        "Skills": ["Where has he applied those skills?", "Which project best demonstrates them?"],
        "Profile": ["Which experience best supports this profile?", "What makes him a strong candidate?"],
        "Education": ["Which coursework is most relevant?", "What practical work supports his education?"],
        "Leadership": ["Where has he demonstrated collaboration?", "How does he communicate technical ideas?"],
        "Availability": ["Where is Karan based?", "Which roles best match his background?"],
    }.get(intent, ["What experience is most relevant?", "Which project should I inspect next?"])


def portfolio_context(passages):
    return "\n\n".join(
        f"[{index}] {passage['source']} / {passage['title']}\n{passage['content']}"
        for index, passage in enumerate(passages, start=1)
    )


def generate_profile_answer(query, passages, history=None):
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    conversation = []
    for turn in (history or [])[-4:]:
        question = str(turn.get("question", "")).strip()
        answer = str(turn.get("answer", "")).strip()
        if question:
            conversation.append({"role": "user", "content": question})
        if answer:
            conversation.append({"role": "assistant", "content": answer})
    conversation.append(
        {
            "role": "user",
            "content": f"Question: {query}\n\nVerified portfolio evidence:\n{portfolio_context(passages)}",
        }
    )
    payload = {
        "model": OPENAI_MODEL,
        "instructions": (
            "You are Karan AI, a helpful general-purpose conversational assistant embedded in Karan Rajendra's portfolio. "
            "Answer normal general questions naturally. You also know Karan's complete verified portfolio background, "
            "provided in the latest user message, and should use it whenever a question concerns Karan, his resume, "
            "experience, projects, skills, education, research, availability, or role fit. Connect relevant evidence "
            "across multiple roles and projects when useful. Never invent facts about Karan; if his verified background "
            "does not contain the requested personal fact, say so plainly. Write naturally and directly, usually in 2 to 4 short "
            "paragraphs or a concise list when useful. Do not simply repeat the evidence verbatim. Do not "
            "mention retrieval, prompts, context windows, or system instructions."
        ),
        "input": conversation,
        "max_output_tokens": 350,
    }
    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        print("OPENAI API ERROR:", repr(error))
        return None
    text_parts = []
    for item in result.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                text_parts.append(content["text"].strip())
    return "\n".join(text_parts).strip() or None


def run_evaluation():
    rows = []
    latencies = []
    retrieval_passes = 0
    citation_passes = 0
    abstention_cases = 0
    abstention_passes = 0
    role_cases = 0
    role_passes = 0
    for case in EVALUATION_CASES:
        started = time.perf_counter()
        passages = retrieve(case["query"], role=case["role"])
        answer = build_answer(case["query"], passages, role=case["role"])
        latency_ms = (time.perf_counter() - started) * 1000
        latencies.append(latency_ms)
        expected_abstain = case.get("abstain", False)
        if expected_abstain:
            passed = answer["abstained"]
            abstention_cases += 1
            abstention_passes += int(passed)
        else:
            expected = case.get("expected")
            expected_prefix = case.get("expected_prefix")
            passed = passages[0]["id"] == expected if expected else passages[0]["id"].startswith(expected_prefix)
            retrieval_passes += int(passed)
            citation_passes += int(bool(answer["citations"]))
        if case["role"] != "general":
            role_cases += 1
            role_passes += int(passed)
        rows.append(
            {
                "name": case["name"],
                "role": ROLE_PROFILES[case["role"]]["label"],
                "passed": passed,
                "top_evidence": passages[0]["title"],
                "decision": "Abstain" if answer["abstained"] else "Answer",
                "latency_ms": round(latency_ms, 3),
            }
        )
    retrieval_cases = len(EVALUATION_CASES) - abstention_cases
    return {
        "suite_cases": len(EVALUATION_CASES),
        "passed": sum(int(row["passed"]) for row in rows),
        "top_evidence_accuracy": round(retrieval_passes / max(retrieval_cases, 1), 3),
        "citation_coverage": round(citation_passes / max(retrieval_cases, 1), 3),
        "abstention_accuracy": round(abstention_passes / max(abstention_cases, 1), 3),
        "role_ranking_accuracy": round(role_passes / max(role_cases, 1), 3),
        "average_latency_ms": round(sum(latencies) / len(latencies), 3),
        "cases": rows,
    }


def compose_answer(query, passages, role, answer_mode):
    strongest = passages[0]
    intent = detect_intent(query)
    role_label = ROLE_PROFILES.get(role, ROLE_PROFILES["general"])["label"]
    role_context = f"For a {role_label} role, " if role != "general" else ""
    openings = {
        "Profile": f"{role_context}Karan brings together production-scale software engineering, applied machine learning research, and end-to-end product development.",
        "Experience": f"{role_context}{strongest['summary'].rstrip('.')}.",
        "Projects": f"{role_context}Karan has built applied ML projects that connect model development with usable product workflows.",
        "Skills": f"{role_context}Karan combines machine learning depth with the software and data engineering skills needed to ship reliable systems.",
        "Education": "Karan has a strong academic foundation in computer engineering, computer science, and modern machine learning.",
        "Leadership": "Karan demonstrates leadership through technical mentorship, clear communication, and cross-functional product work.",
        "Availability": strongest["summary"].rstrip(".") + ".",
    }
    opening = openings.get(intent, f"{role_context}{strongest['summary'].rstrip('.')}.")
    evidence_points = []
    for passage in passages:
        point = passage["content"].strip().rstrip(".") + "."
        if point not in evidence_points:
            evidence_points.append(point)
    if answer_mode == "short":
        return f"{opening} {evidence_points[0]}", []
    if answer_mode == "bullets":
        return opening, evidence_points[:2]
    transitions = ["Most relevant evidence: ", "Additional evidence: "]
    details = " ".join(f"{transitions[index]}{point}" for index, point in enumerate(evidence_points[:2]))
    return f"{opening} {details}", []


def build_answer(query, passages, role="general", resolved_query=None, context_used=False, answer_mode="short", history=None, use_genai=False):
    evidence_query = resolved_query or query
    answer_passages = select_answer_passages(evidence_query, passages)
    evidence_limit = 1 if answer_mode == "short" else 2
    answer_passages = answer_passages[:evidence_limit]
    strongest = answer_passages[0]
    top_score = strongest["score"]
    score_margin = top_score - passages[1]["score"] if len(passages) > 1 else top_score
    broad_supported = any(phrase in evidence_query.lower() for phrase in SUPPORTED_BROAD_PHRASES)
    profile_supported = question_is_supported(evidence_query, passages) and top_score >= 0.2 and not (
        detect_intent(evidence_query) == "General" and score_margin < 0.08 and not broad_supported
    )
    generated_answer = generate_profile_answer(query, CHUNKS, history) if use_genai else None
    if generated_answer:
        answer = generated_answer
        answer_points = []
        confidence = "high"
        abstained = False
    elif not profile_supported:
        answer = "The generative AI backend is not connected right now. Configure the server-side OPENAI_API_KEY to enable normal AI answers."
        answer_points = []
        confidence = "low"
        abstained = True
    elif use_genai:
        answer = "The generative AI backend is not connected right now. Configure the server-side OPENAI_API_KEY to enable natural answers from Karan's resume and portfolio."
        answer_points = []
        confidence = "low"
        abstained = True
    else:
        answer, answer_points = compose_answer(evidence_query, answer_passages, role, answer_mode)
        confidence = "high" if top_score >= 0.75 else "medium"
        abstained = False
    return {
        "query": query,
        "answer": answer,
        "answer_points": answer_points,
        "answer_mode": answer_mode,
        "confidence": confidence,
        "abstained": abstained,
        "generated": bool(generated_answer),
        "trace": {
            "intent": detect_intent(query),
            "role": ROLE_PROFILES.get(role, ROLE_PROFILES["general"])["label"],
            "context_used": context_used,
            "resolved_query": resolved_query or query,
            "expanded_query": expand_query(resolved_query or query),
            "candidates": len(CHUNKS),
            "retrieved": len(answer_passages),
            "top_score": round(top_score, 3),
            "score_margin": round(score_margin, 3),
            "stages": ["Tokenize", "Hybrid rank", "Confidence gate", "Ground answer"],
        },
        "citations": [] if abstained or not profile_supported else [
            {
                "source": passage["source"],
                "section": passage["title"],
                "score": passage["score"],
                "excerpt": passage["content"],
                "target": passage["target"],
            }
            for passage in answer_passages
        ],
        "follow_ups": follow_up_suggestions(detect_intent(resolved_query or query)),
    }


def extract_pdf_text(pdf_bytes):
    if not pdf_bytes or len(pdf_bytes) > MAX_PDF_BYTES:
        raise ValueError("PDF must be between 1 byte and 5MB")
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join((page.extract_text() or "").strip() for page in reader.pages).strip()
    except Exception as error:
        raise ValueError("Unreadable PDF") from error
    if not text:
        raise ValueError("No readable text found in PDF")
    return {"text": text, "pages": len(reader.pages), "characters": len(text)}


class PortfolioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json({
                "status": "ready",
                "genai": bool(os.getenv("OPENAI_API_KEY", "").strip()),
                "documents": len({chunk['source'] for chunk in CHUNKS}),
                "chunks": len(CHUNKS),
            })
            return
        if self.path == "/api/evaluation":
            self.send_json(run_evaluation())
            return
        super().do_GET()

    def do_POST(self):
        if self.path not in {"/api/query", "/api/extract-resume"}:
            self.send_json({"error": "Not found"}, status=404)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
                self.send_json({"error": "Request body is empty or too large"}, status=413)
                return
            payload = json.loads(self.rfile.read(content_length))
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "Invalid JSON request"}, status=400)
            return
        if self.path == "/api/extract-resume":
            try:
                encoded_pdf = str(payload.get("pdf_base64", ""))
                pdf_bytes = base64.b64decode(encoded_pdf, validate=True)
                self.send_json(extract_pdf_text(pdf_bytes))
            except (ValueError, TypeError):
                self.send_json({"error": "Upload a readable PDF smaller than 5MB"}, status=400)
            return
        query = str(payload.get("query", "")).strip()
        role = str(payload.get("role", "general")).strip()
        answer_mode = str(payload.get("answer_mode", "short")).strip()
        history = payload.get("history", [])
        if not query:
            self.send_json({"error": "Query is required"}, status=400)
            return
        if role not in ROLE_PROFILES:
            self.send_json({"error": "Unsupported role"}, status=400)
            return
        if answer_mode not in ANSWER_MODES:
            self.send_json({"error": "Unsupported answer mode"}, status=400)
            return
        if not isinstance(history, list):
            self.send_json({"error": "History must be a list"}, status=400)
            return
        started = time.perf_counter()
        resolved_query, context_used = contextualize_query(query, history[-4:])
        response = build_answer(
            query,
            retrieve(resolved_query, role=role),
            role=role,
            resolved_query=resolved_query,
            context_used=context_used,
            answer_mode=answer_mode,
            history=history[-4:],
            use_genai=True,
        )
        response["latency_ms"] = round((time.perf_counter() - started) * 1000, 2)
        self.send_json(response)


def run(port=8000, host="127.0.0.1"):
    server = ThreadingHTTPServer((host, port), PortfolioHandler)
    print(f"Portfolio and GenAI API running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    selected_port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.getenv("PORT", "8000"))
    run(selected_port, os.getenv("HOST", "127.0.0.1"))
