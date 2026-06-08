const header = document.querySelector(".site-header");
const reveals = document.querySelectorAll(".reveal");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuLinks = mobileMenu.querySelectorAll("a");
const sectionLinks = document.querySelectorAll('a[href^="#"]');
const trackedSections = document.querySelectorAll("main section[id]");
const counters = document.querySelectorAll("[data-count]");
const themeToggles = document.querySelectorAll(".theme-toggle, .mobile-theme-toggle");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("portfolio-theme", theme);
  const isDark = theme === "dark";
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#0e1513" : "#f4f3ee");
  themeToggles.forEach((toggle) => {
    toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  });
}

const savedTheme = localStorage.getItem("portfolio-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme);
themeToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
});

function closeMobileMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
  mobileMenu.setAttribute("aria-hidden", String(!willOpen));
  mobileMenu.classList.toggle("open", willOpen);
  document.body.classList.toggle("menu-open", willOpen);
});

mobileMenuLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 850) closeMobileMenu();
});

function updateActiveNavigation() {
  const marker = window.scrollY + Math.min(window.innerHeight * 0.38, 280);
  let activeSection = null;

  trackedSections.forEach((section) => {
    if (section.offsetTop <= marker) activeSection = section;
  });

  const activeId = activeSection ? `#${activeSection.id}` : "";
  sectionLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeId);
  });
}

window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("hashchange", updateActiveNavigation);
updateActiveNavigation();

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const suffix = counter.dataset.suffix || "";
  const decimals = String(target).includes(".") ? 1 : 0;
  const duration = 1100;
  const started = performance.now();

  counter.classList.add("counting");
  function update(now) {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      counter.textContent = `${target.toFixed(decimals)}${suffix}`;
      counter.classList.remove("counting");
    }
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        entry.target.textContent = `${entry.target.dataset.count}${entry.target.dataset.suffix || ""}`;
      } else {
        animateCounter(entry.target);
      }
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const projectToggles = document.querySelectorAll(".project-toggle");
const projectDemoLinks = document.querySelectorAll(".project-action-primary[href^='#']");
const caseStudyModal = document.getElementById("case-study-modal");
const caseStudyDialog = caseStudyModal.querySelector(".case-study-dialog");
const caseStudyClose = caseStudyModal.querySelector(".case-study-close");
const caseStudyTitle = document.getElementById("case-study-title");
const caseStudyTag = document.getElementById("case-study-tag");
const caseStudyResults = document.getElementById("case-study-results");
const caseStudyContent = document.getElementById("case-study-content");
const caseStudyFooter = document.getElementById("case-study-footer");
let caseStudyTrigger = null;

function closeCaseStudy() {
  caseStudyModal.classList.remove("open");
  caseStudyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  caseStudyTrigger?.focus();
}

projectToggles.forEach((toggle) => {
  toggle.setAttribute("aria-haspopup", "dialog");
  toggle.addEventListener("click", () => {
    const card = toggle.closest(".project-card");
    const launchLink = card.querySelector(".project-action-primary");
    caseStudyTrigger = toggle;
    caseStudyTitle.textContent = card.querySelector("h3").textContent;
    caseStudyTag.textContent = card.querySelector(".project-tag").textContent;
    caseStudyResults.innerHTML = card.querySelector(".project-results").innerHTML;
    caseStudyContent.innerHTML = card.querySelector(".project-details").innerHTML;
    caseStudyFooter.innerHTML = launchLink ? launchLink.outerHTML : "";
    caseStudyModal.classList.add("open");
    caseStudyModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => caseStudyClose.focus(), 0);
  });
});
caseStudyModal.querySelectorAll("[data-close-case-study]").forEach((button) => button.addEventListener("click", closeCaseStudy));
caseStudyFooter.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (link) closeCaseStudy();
});
document.addEventListener("keydown", (event) => {
  if (!caseStudyModal.classList.contains("open")) return;
  if (event.key === "Escape") closeCaseStudy();
  if (event.key === "Tab") {
    const focusable = [...caseStudyDialog.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!caseStudyDialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
projectDemoLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    window.scrollTo({
      top: target.offsetTop - header.offsetHeight,
      behavior: "auto"
    });
    updateActiveNavigation();
  });
});

const hero = document.querySelector(".hero");
const heroCard = document.querySelector(".hero-card");
if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroCard.style.transform = `rotate(${2 + x * 2}deg) translate(${x * 5}px, ${y * 5}px)`;
  });
  hero.addEventListener("pointerleave", () => {
    heroCard.style.transform = "";
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

reveals.forEach((element) => observer.observe(element));

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
let selectedAnswerMode = "short";
let evaluationExpanded = false;
let latestEvaluationRows = [];

function renderAnswer(question) {
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">!</span>
      <div><strong>AI backend not connected</strong><small>Real generated answers require the portfolio backend.</small></div>
    </div>
    <p class="answer-body">This static preview cannot generate AI responses. Run or deploy the Python backend with a server-side OPENAI_API_KEY.</p>
  `;
}

function renderApiAnswer(result) {
  const points = result.answer_points?.length
    ? `<ul class="answer-points">${result.answer_points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
    : "";
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">${result.abstained ? "!" : "AI"}</span>
      <div><strong>${result.abstained ? "I don't have enough evidence for that yet." : "Here's what I found."}</strong><small>${result.generated ? "Generated from verified portfolio evidence" : "Based on Karan's portfolio"}</small></div>
    </div>
    <p class="answer-body">${escapeHtml(result.answer)}</p>
    ${result.genai_error ? `<p class="answer-error">${escapeHtml(result.genai_error)}</p>` : ""}
    ${points}
    <div class="citation-row">${result.citations.map((citation) => `<span>${citation.source} / ${citation.section}</span>`).join("")}</div>
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

function renderConversation() {
  conversationHistory.innerHTML = ragHistory.length ? ragHistory.map(turn => `
    <article><span>You / ${escapeHtml(turn.role)}</span><strong>${escapeHtml(turn.question)}</strong><p>${escapeHtml(turn.answer)}</p></article>
  `).join("") : `<p>Start with a suggested question or ask anything.</p>`;
}

function renderFollowUps(suggestions = []) {
  followUpPrompts.hidden = !suggestions.length;
  followUpPrompts.innerHTML = suggestions.map(suggestion => `<button type="button" data-follow-up="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join("");
}

function renderRetrievalTrace(result) {
  const trace = result.trace;
  retrievalInspector.hidden = false;
  traceSummary.textContent = `${trace.intent} intent / ${trace.retrieved} passages`;
  const metrics = [
    ["Target role", trace.role],
    ["Context", trace.context_used ? "Follow-up" : "Standalone"],
    ["Candidates", trace.candidates],
    ["Top relevance", trace.top_score.toFixed(3)],
    ["Score margin", trace.score_margin.toFixed(3)],
    ["Decision", result.abstained ? "Abstain" : "Answer"]
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
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">AI</span>
      <div><strong>Thinking...</strong><small>Looking through Karan's portfolio</small></div>
    </div>
  `;

  try {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question, role: selectedRole, answer_mode: selectedAnswerMode, history: ragHistory })
    });
    if (!response.ok) throw new Error("RAG API unavailable");
    const result = await response.json();
    if (requestId === latestRagRequest) renderApiAnswer(result);
  } catch {
    if (requestId === latestRagRequest) renderAnswer(question);
  }
}

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
  ragInput.value = question;
  await queryRag(question);
}

async function checkApiStatus() {
  const status = document.getElementById("api-status");
  const stats = document.getElementById("index-stats");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("API unavailable");
    const health = await response.json();
    status.textContent = "Live";
    stats.textContent = `${health.documents} sources / ${health.chunks} evidence chunks`;
  } catch {
    status.textContent = "Demo";
  }
}

async function loadEvaluation() {
  try {
    const response = await fetch("/api/evaluation");
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
  const question = ragInput.value.trim();
  if (question) await queryRag(question);
});

promptButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    ragInput.value = button.dataset.question;
    await queryRag(button.dataset.question);
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
  ragInput.value = button.dataset.followUp;
  await queryRag(button.dataset.followUp);
});

clearConversation.addEventListener("click", () => {
  ragHistory = [];
  renderConversation();
  renderFollowUps();
  retrievalInspector.hidden = true;
  latestQuestion = "";
  shareQuestion.disabled = true;
  shareStatus.textContent = "";
  ragOutput.innerHTML = `<div class="answer-header"><span class="answer-icon">AI</span><div><strong>Conversation cleared</strong><small>Ask anything to begin again.</small></div></div>`;
});

shareQuestion.addEventListener("click", copyShareLink);
evaluationToggle.addEventListener("click", () => {
  evaluationExpanded = !evaluationExpanded;
  renderEvaluationCases();
});
checkApiStatus();
loadEvaluation();
loadSharedQuestion();
