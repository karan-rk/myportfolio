/* ─── ai-chat.js ─────────────────────────────────────────────────
   Portfolio AI (RAG) chat system: API config, query, rendering,
   conversation history, follow-ups, evaluation panel, cold-start.
   Backend endpoint: see meta[name="portfolio-api-url"] in index.html
   ─────────────────────────────────────────────────────────────── */

const configuredApiUrl = document.querySelector('meta[name="portfolio-api-url"]')?.content?.replace(/\/$/, "") || "";
const isLocalPortfolio = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = isLocalPortfolio ? "" : configuredApiUrl;
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const aiSection = document.getElementById("rag-lab");

const ragForm = document.getElementById("rag-form");
const ragInput = document.getElementById("rag-question");
const ragOutput = document.getElementById("rag-output");
const retrievalInspector = document.getElementById("retrieval-inspector");
const traceSummary = document.getElementById("trace-summary");
const traceMetrics = document.getElementById("trace-metrics");
const evidenceList = document.getElementById("evidence-list");
const targetRole = document.getElementById("target-role");
const answerModeButtons = document.querySelectorAll("[data-answer-mode]");
const promptButtons = document.querySelectorAll("[data-question]");
const returnToAssistant = document.getElementById("return-to-assistant");
const conversationHistory = document.getElementById("conversation-history");
const conversationToggle = document.getElementById("conversation-toggle");
const clearConversation = document.getElementById("clear-conversation");
const followUpPrompts = document.getElementById("follow-up-prompts");
const shareQuestion = document.getElementById("share-question");
const shareStatus = document.getElementById("share-status");
const evaluationStatus = document.getElementById("evaluation-status");
const evaluationMetrics = document.getElementById("evaluation-metrics");
const evaluationCases = document.getElementById("evaluation-cases");
const evaluationToggle = document.getElementById("evaluation-toggle");
let latestRagRequest = 0;
let ragHistory = [];
let latestQuestion = "";
let selectedAnswerMode = "detailed";
let evaluationExpanded = false;
let latestEvaluationRows = [];
let backendWarm = false;
let warmupNoticeActive = false;

function renderAnswer(question) {
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">!</span>
      <div><strong>The assistant is temporarily unavailable.</strong><small>Please try again in a moment.</small></div>
    </div>
    <p class="answer-body">The portfolio assistant could not be reached. You can still explore Karan's experience, projects, and skills on this page.</p>
  `;
}

function renderRequestError(message) {
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">!</span>
      <div><strong>I couldn't process that question.</strong><small>Please adjust it and try again.</small></div>
    </div>
    <p class="answer-body">${escapeHtml(message)}</p>
  `;
}

function renderApiAnswer(result) {
  const points = result.answer_points?.length
    ? `<ul class="answer-points">${result.answer_points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
    : "";
  const presentation = {
    conversation: ["AI", "Karan AI"],
    evidence: ["AI", "Karan AI"],
    generated: ["AI", "Karan AI"],
    scope: ["AI", "Karan AI"]
  }[result.response_type] || ["AI", "Karan AI"];
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">${presentation[0]}</span>
      <div><strong>${presentation[1]}</strong></div>
    </div>
    <p class="answer-body">${escapeHtml(result.answer)}</p>
    ${points}
  `;
  latestQuestion = result.query;
  shareQuestion.disabled = false;
  ragHistory.push({
    question: result.query,
    answer: result.answer,
    topic: result.citations[0]?.section || result.trace.intent,
    role: result.trace.role
  });
  ragHistory = ragHistory.slice(-4);
  renderConversation();
  renderFollowUps(result.follow_ups);
  renderRetrievalTrace(result);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function capitalizeFirstAlpha(value) {
  const text = String(value || "");
  const index = text.search(/[A-Za-z]/);
  if (index < 0) return text;
  return `${text.slice(0, index)}${text[index].toUpperCase()}${text.slice(index + 1)}`;
}

function renderConversation() {
  conversationHistory.innerHTML = ragHistory.length ? ragHistory.map(turn => `
    <article><span>You / ${escapeHtml(turn.role)}</span><strong>${escapeHtml(capitalizeFirstAlpha(turn.question))}</strong><p>${escapeHtml(capitalizeFirstAlpha(turn.answer))}</p></article>
  `).join("") : `<p>Start with a suggested question or ask about Karan's work.</p>`;
}

conversationToggle.addEventListener("click", () => {
  const expanded = conversationToggle.getAttribute("aria-expanded") === "true";
  conversationToggle.setAttribute("aria-expanded", String(!expanded));
  conversationToggle.textContent = expanded ? "Show history" : "Hide history";
  conversationHistory.hidden = expanded;
});

function renderFollowUps(suggestions = []) {
  followUpPrompts.hidden = !suggestions.length;
  followUpPrompts.innerHTML = suggestions.map(suggestion => `<button type="button" data-follow-up="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join("");
}

function renderRetrievalTrace(result) {
  const trace = result.trace;
  if (result.response_type === "conversation" || result.response_type === "scope") {
    retrievalInspector.hidden = true;
    return;
  }
  retrievalInspector.hidden = false;
  traceSummary.textContent = `${trace.intent} intent / ${trace.retrieved} passages`;
  const metrics = [
    ["Target role", trace.role],
    ["Context", trace.context_used ? "Follow-up" : "Standalone"],
    ["Corrections", Object.entries(trace.corrections || {}).map(([from, to]) => `${from} -> ${to}`).join(", ") || "None"],
    ["Candidates", trace.candidates],
    ["Top relevance", trace.top_score.toFixed(3)],
    ["Score margin", trace.score_margin.toFixed(3)],
    ["Decision", result.response_type === "generated" ? "Generated" : "Evidence-backed answer"]
  ];
  traceMetrics.innerHTML = metrics.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  evidenceList.innerHTML = result.citations.length ? result.citations.map((citation, index) => `
    <button class="evidence-card" type="button" data-evidence-target="${citation.target}" aria-label="View ${citation.section} in portfolio">
      <div><span>#${index + 1} ${citation.source}</span><strong>${citation.score.toFixed(3)}</strong></div>
      <h5>${citation.section}</h5>
      <p>${citation.excerpt}</p>
      <div class="evidence-score"><i style="width:${Math.min(citation.score * 100, 100)}%"></i></div>
    </button>
  `).join("") : `<div class="evidence-empty">No passage cleared the confidence gate, so no citations were attached.</div>`;
  const citedSources = new Set(result.citations.map(citation => citation.source));
  document.querySelectorAll(".source-item").forEach(item => {
    item.classList.toggle("active", citedSources.has(item.querySelector("strong").textContent));
  });
}

evidenceList.addEventListener("click", (event) => {
  const evidence = event.target.closest("[data-evidence-target]");
  if (!evidence) return;
  const target = document.getElementById(evidence.dataset.evidenceTarget);
  if (!target) return;
  target.classList.add("evidence-highlight");
  returnToAssistant.hidden = false;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => target.classList.remove("evidence-highlight"), 2200);
});

returnToAssistant.addEventListener("click", () => {
  document.getElementById("rag-lab").scrollIntoView({ behavior: "smooth", block: "start" });
  returnToAssistant.hidden = true;
});

async function queryRag(question) {
  const requestId = ++latestRagRequest;
  const selectedRole = targetRole.value;
  retrievalInspector.hidden = true;
  warmupNoticeActive = false;
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">AI</span>
      <div>
        <strong>Preparing an answer…</strong>
        ${!backendWarm ? "<small>The backend is starting up — this first response may take about 30 seconds.</small>" : ""}
      </div>
    </div>
  `;

  try {
    const response = await fetch(apiUrl("/api/query"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question, role: selectedRole, answer_mode: selectedAnswerMode, history: ragHistory })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (requestId === latestRagRequest) renderRequestError(error.error || "The question could not be processed.");
      return;
    }
    const result = await response.json();
    if (requestId === latestRagRequest) renderApiAnswer(result);
  } catch {
    if (requestId === latestRagRequest) renderAnswer(question);
  }
}

async function submitRagQuestion(question) {
  const normalizedQuestion = String(question || "").trim();
  if (!normalizedQuestion) return;
  ragInput.value = "";
  ragInput.focus();
  await queryRag(normalizedQuestion);
}

async function typeAndSubmitProjectQuestion(question) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ragInput.value = "";
  ragInput.focus();
  if (!reducedMotion) {
    for (const character of question) {
      ragInput.value += character;
      await new Promise((resolve) => window.setTimeout(resolve, 18));
    }
    await new Promise((resolve) => window.setTimeout(resolve, 220));
  } else {
    ragInput.value = question;
  }
  await submitRagQuestion(question);
}

document.addEventListener("click", async (event) => {
  const link = event.target.closest("[data-project-question]");
  if (!link) return;
  event.preventDefault();
  const question = link.dataset.projectQuestion;
  history.pushState(null, "", buildShareUrl(question, targetRole.value));
  aiSection.scrollIntoView({ behavior: "smooth", block: "start" });
  await typeAndSubmitProjectQuestion(question);
});

function buildShareUrl(question, role) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("ask", question);
  if (role !== "general") url.searchParams.set("role", role);
  url.hash = "rag-lab";
  return url.toString();
}

async function copyShareLink() {
  if (!latestQuestion) return;
  const url = buildShareUrl(latestQuestion, targetRole.value);
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = "Link copied";
  } catch {
    window.prompt("Copy this shareable link", url);
    shareStatus.textContent = "Link ready";
  }
  window.setTimeout(() => { shareStatus.textContent = ""; }, 2500);
}

async function loadSharedQuestion() {
  const params = new URLSearchParams(window.location.search);
  const question = params.get("ask")?.trim();
  const role = params.get("role");
  if (!question) return;
  if ([...targetRole.options].some(option => option.value === role)) targetRole.value = role;
  await submitRagQuestion(question);
}

async function checkApiStatus() {
  const status = document.getElementById("api-status");
  const stats = document.getElementById("index-stats");

  // If the Render free-tier backend is cold, health check takes 25-35 seconds.
  // After 5 seconds with no response, show a warm-up notice so the recruiter
  // knows the delay is expected, not a broken feature.
  const warmupTimer = window.setTimeout(() => {
    if (!backendWarm && !warmupNoticeActive) {
      warmupNoticeActive = true;
      ragOutput.innerHTML = `
        <div class="answer-header">
          <span class="answer-icon">AI</span>
          <div><strong>The AI is warming up.</strong><small>The backend takes ~30 seconds to start on first use — ask your question now and it will answer once ready.</small></div>
        </div>
        <p class="answer-body">Feel free to explore projects and experience in the meantime.</p>
      `;
    }
  }, 5000);

  try {
    const response = await fetch(apiUrl("/api/health"));
    clearTimeout(warmupTimer);
    if (!response.ok) throw new Error("API unavailable");
    const health = await response.json();
    backendWarm = true;
    status.textContent = "Live";
    stats.textContent = `${health.documents} sources / ${health.chunks} evidence chunks`;
    if (warmupNoticeActive) {
      warmupNoticeActive = false;
      ragOutput.innerHTML = `<div class="answer-header"><span class="answer-icon">AI</span><div><strong>Hi, I'm Karan AI.</strong><small>The assistant is ready — ask about Karan's work, projects, skills, or resume.</small></div></div>`;
    }
  } catch {
    clearTimeout(warmupTimer);
    status.textContent = "Demo";
    if (warmupNoticeActive) {
      warmupNoticeActive = false;
      ragOutput.innerHTML = `<div class="answer-header"><span class="answer-icon">AI</span><div><strong>Hi, I'm Karan AI.</strong><small>Ask about Karan's work, projects, skills, architecture, or resume.</small></div></div>`;
    }
  }
}

async function loadEvaluation() {
  try {
    const response = await fetch(apiUrl("/api/evaluation"));
    if (!response.ok) throw new Error("Evaluation unavailable");
    const result = await response.json();
    evaluationStatus.textContent = `${result.passed}/${result.suite_cases} cases passing`;
    const metrics = [
      ["Top evidence", `${(result.top_evidence_accuracy * 100).toFixed(0)}%`, "correct first result"],
      ["Citation coverage", `${(result.citation_coverage * 100).toFixed(0)}%`, "answered queries cited"],
      ["Abstention", `${(result.abstention_accuracy * 100).toFixed(0)}%`, "unsupported queries refused"],
      ["Role ranking", `${(result.role_ranking_accuracy * 100).toFixed(0)}%`, "role evidence correct"],
      ["Avg latency", `${result.average_latency_ms.toFixed(2)}ms`, "local evaluation"]
    ];
    evaluationMetrics.innerHTML = metrics.map(([label, value, note]) => `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
    latestEvaluationRows = result.cases;
    renderEvaluationCases();
  } catch {
    evaluationStatus.textContent = "Evaluation unavailable";
  }
}

function renderEvaluationCases() {
  const rows = evaluationExpanded ? latestEvaluationRows : latestEvaluationRows.slice(0, 4);
  evaluationCases.innerHTML = rows.map(row => `<div class="${row.passed ? "pass" : "fail"}"><i>${row.passed ? "Pass" : "Fail"}</i><strong>${row.name}</strong><span>${row.role}</span><small>${row.top_evidence} / ${row.decision}</small></div>`).join("");
  evaluationToggle.textContent = evaluationExpanded ? "Hide test details" : `Show all ${latestEvaluationRows.length} tests`;
  evaluationToggle.setAttribute("aria-expanded", String(evaluationExpanded));
}

ragForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitRagQuestion(ragInput.value);
});

promptButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await submitRagQuestion(button.dataset.question);
  });
});

answerModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedAnswerMode = button.dataset.answerMode;
    answerModeButtons.forEach(modeButton => modeButton.classList.toggle("active", modeButton === button));
  });
});

followUpPrompts.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-follow-up]");
  if (!button) return;
  await submitRagQuestion(button.dataset.followUp);
});

clearConversation.addEventListener("click", () => {
  ragHistory = [];
  renderConversation();
  renderFollowUps();
  retrievalInspector.hidden = true;
  latestQuestion = "";
  ragInput.value = "";
  ragInput.focus();
  shareQuestion.disabled = true;
  shareStatus.textContent = "";
  conversationHistory.hidden = true;
  conversationToggle.setAttribute("aria-expanded", "false");
  conversationToggle.textContent = "Show history";
  ragOutput.innerHTML = `<div class="answer-header"><span class="answer-icon">AI</span><div><strong>Conversation cleared</strong><small>Ask about Karan's work to begin again.</small></div></div>`;
});

shareQuestion.addEventListener("click", copyShareLink);
evaluationToggle.addEventListener("click", () => {
  evaluationExpanded = !evaluationExpanded;
  renderEvaluationCases();
});

window.KaranAI = Object.freeze({ capitalizeFirstAlpha });
checkApiStatus();
loadEvaluation();
loadSharedQuestion();
