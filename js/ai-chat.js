/* ─── ai-chat.js ──────────────────────────────────────────────────────
   Portfolio AI — chat bubble UI
   Backend: see meta[name="portfolio-api-url"] in index.html
   ─────────────────────────────────────────────────────────────────── */

const configuredApiUrl = document.querySelector('meta[name="portfolio-api-url"]')?.content?.replace(/\/$/, "") || "";
const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = isLocal ? "" : configuredApiUrl;
const apiUrl = path => `${API_BASE_URL}${path}`;

// inline chat
const ragForm       = document.getElementById("rag-form");
const ragInput      = document.getElementById("rag-question");
const chatMessages  = document.getElementById("chat-messages");
const suggestedWrap = document.getElementById("suggested-prompts");
const targetRole    = document.getElementById("target-role");
const clearBtn      = document.getElementById("clear-conversation");
const returnBtn     = document.getElementById("return-to-assistant");
const apiStatus     = document.getElementById("api-status");

// floating chat
const floatBtn      = document.getElementById("float-chat-btn");
const floatPanel    = document.getElementById("float-chat-panel");
const floatClose    = document.getElementById("float-chat-close");
const floatForm     = document.getElementById("float-rag-form");
const floatInput    = document.getElementById("float-rag-question");
const floatMessages = document.getElementById("float-chat-messages");

const SURPRISE_QUESTIONS = [
  "What impact did Karan have at Meta at billion-user scale?",
  "How did Karan reduce inference latency by 40% in Speech Emotion Detection?",
  "Why was Logistic Regression selected as champion in Sentinel over ensemble methods?",
  "How does the EKS GitOps architecture recover from configuration drift?",
  "Why did Karan use temporal validation instead of random splitting in Sentinel?",
  "What throughput improvements did Karan achieve in distributed systems research?",
  "How does Karan AI answer reliably when OpenAI is offline?",
  "What makes RoleFit's resume rewrites evidence-safe?",
  "How does the AWS three-tier architecture handle regional failover?",
  "How does Karan's persuasion research connect to production NLP?",
];
let lastSurpriseIndex = -1;

let ragHistory      = [];
let latestRequest   = 0;
let suggestionsUsed = false;
let backendWarm     = false;
let floatOpen       = false;

/* ── helpers ─────────────────────────────────────────────────────── */
function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]
  );
}

function scrollBottom() {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
}

function scrollFloatBottom() {
  floatMessages?.scrollTo({ top: floatMessages.scrollHeight, behavior: "smooth" });
}

function hideSuggestions() {
  if (suggestionsUsed) return;
  suggestionsUsed = true;
  suggestedWrap.style.cssText = "opacity:0;max-height:0;overflow:hidden;padding:0;transition:opacity .3s,max-height .4s,padding .3s";
}

/* ── bubble factories ─────────────────────────────────────────────── */
function addUserBubble(text) {
  const row = document.createElement("div");
  row.className = "chat-msg user";
  row.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
  chatMessages.appendChild(row);
  scrollBottom();
}

function showTyping() {
  if (document.getElementById("typing-bubble")) return;
  const row = document.createElement("div");
  row.className = "chat-msg ai";
  row.id = "typing-bubble";
  row.innerHTML = `<div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatMessages.appendChild(row);
  scrollBottom();
}

function hideTyping() {
  document.getElementById("typing-bubble")?.remove();
}

async function addAIBubble(result) {
  const row = document.createElement("div");
  row.className = "chat-msg ai";
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  row.appendChild(bubble);
  chatMessages.appendChild(row);

  const text = result?.answer || "I couldn't reach the backend right now. Try again in a moment.";
  await streamText(bubble, text, scrollBottom);

  if (result?.answer_points?.length) {
    const ul = document.createElement("ul");
    ul.className = "answer-points";
    result.answer_points.forEach(pt => {
      const li = document.createElement("li");
      li.textContent = pt;
      ul.appendChild(li);
    });
    bubble.appendChild(ul);
    scrollBottom();
  }

  if (result?.capture_lead) {
    bubble.insertAdjacentHTML("beforeend", `
      <div class="lead-capture" id="lead-capture">
        <p class="lead-intro">Want to connect with Karan? Leave your details.</p>
        <form id="lead-form" class="lead-form" novalidate>
          <div class="lead-fields">
            <input type="text" name="name" placeholder="Your name" autocomplete="name">
            <input type="email" name="email" placeholder="Email address" autocomplete="email" required>
            <button type="submit" class="lead-submit">Send</button>
          </div>
          <p class="lead-error-msg" hidden></p>
        </form>
      </div>`);
  }

  if (result?.follow_ups?.length) {
    const chips = document.createElement("div");
    chips.className = "chat-follow-ups";
    result.follow_ups.forEach(q => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = q;
      btn.addEventListener("click", () => submitQuestion(q));
      chips.appendChild(btn);
    });
    row.appendChild(chips);
    scrollBottom();
  }
}

async function addAIError(msg) {
  const row = document.createElement("div");
  row.className = "chat-msg ai";
  row.innerHTML = `<div class="chat-bubble chat-bubble-error">${escapeHtml(msg)}</div>`;
  chatMessages.appendChild(row);
  scrollBottom();
}

/* ── text streaming ───────────────────────────────────────────────── */
async function streamText(el, text, onScroll = scrollBottom) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { el.textContent = text; return; }
  el.textContent = "";
  const CHUNK = 3;
  for (let i = 0; i < text.length; i += CHUNK) {
    el.textContent += text.slice(i, i + CHUNK);
    if (i % 45 === 0) onScroll();
    await new Promise(r => setTimeout(r, 11));
  }
  onScroll();
}

/* ── inline API ───────────────────────────────────────────────────── */
async function queryRag(question) {
  const reqId = ++latestRequest;
  showTyping();

  try {
    const res = await fetch(apiUrl("/api/query"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: question,
        role: targetRole?.value || "general",
        answer_mode: "detailed",
        history: ragHistory,
      }),
    });

    hideTyping();
    if (reqId !== latestRequest) return;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      await addAIError(err.error || "The question could not be processed.");
      return;
    }

    const result = await res.json();
    if (reqId !== latestRequest) return;

    await addAIBubble(result);

    ragHistory.push({
      question: result.query,
      answer: result.answer,
      topic: result.citations?.[0]?.section || result.trace?.intent,
      role: result.trace?.role,
    });
    ragHistory = ragHistory.slice(-4);

  } catch {
    hideTyping();
    if (reqId === latestRequest) {
      await addAIError("The portfolio assistant couldn't be reached. Explore projects and experience on this page in the meantime.");
    }
  }
}

async function submitQuestion(question) {
  const q = String(question || "").trim();
  if (!q) return;
  ragInput.value = "";
  ragInput.focus();
  hideSuggestions();
  addUserBubble(q);
  await queryRag(q);
}

/* ── floating chat ────────────────────────────────────────────────── */
function openFloatChat() {
  floatOpen = true;
  floatPanel?.removeAttribute("aria-hidden");
  floatPanel?.classList.add("open");
  floatBtn?.classList.add("active");
  floatInput?.focus();
  if (floatMessages && !floatMessages.children.length) {
    const row = document.createElement("div");
    row.className = "chat-msg ai";
    row.innerHTML = `<div class="chat-bubble"><strong>Hi, I&rsquo;m Karan AI.</strong> Ask me anything about Karan&rsquo;s work.</div>`;
    floatMessages.appendChild(row);
  }
}

function closeFloatChat() {
  floatOpen = false;
  floatPanel?.setAttribute("aria-hidden", "true");
  floatPanel?.classList.remove("open");
  floatBtn?.classList.remove("active");
}

floatBtn?.addEventListener("click", () => floatOpen ? closeFloatChat() : openFloatChat());
floatClose?.addEventListener("click", closeFloatChat);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && floatOpen) closeFloatChat();
});

const ragSection = document.getElementById("rag-lab");
if (ragSection && floatBtn) {
  const ragObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        floatBtn.hidden = true;
        if (floatOpen) closeFloatChat();
      } else {
        floatBtn.hidden = false;
      }
    },
    { threshold: 0.1 }
  );
  ragObserver.observe(ragSection);
}

async function addFloatAIBubble(result) {
  if (!floatMessages) return;
  const row = document.createElement("div");
  row.className = "chat-msg ai";
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  row.appendChild(bubble);
  floatMessages.appendChild(row);

  const text = result?.answer || "I couldn't reach the backend right now. Try again.";
  await streamText(bubble, text, scrollFloatBottom);

  if (result?.answer_points?.length) {
    const ul = document.createElement("ul");
    ul.className = "answer-points";
    result.answer_points.forEach(pt => {
      const li = document.createElement("li");
      li.textContent = pt;
      ul.appendChild(li);
    });
    bubble.appendChild(ul);
    scrollFloatBottom();
  }

  if (result?.follow_ups?.length) {
    const chips = document.createElement("div");
    chips.className = "chat-follow-ups";
    result.follow_ups.forEach(q => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = q;
      btn.addEventListener("click", () => submitFloatQuestion(q));
      chips.appendChild(btn);
    });
    row.appendChild(chips);
  }

  scrollFloatBottom();
}

async function submitFloatQuestion(question) {
  if (!floatMessages) return;
  const q = String(question || "").trim();
  if (!q) return;
  if (floatInput) floatInput.value = "";

  const userRow = document.createElement("div");
  userRow.className = "chat-msg user";
  userRow.innerHTML = `<div class="chat-bubble">${escapeHtml(q)}</div>`;
  floatMessages.appendChild(userRow);
  scrollFloatBottom();

  const typingRow = document.createElement("div");
  typingRow.className = "chat-msg ai";
  typingRow.id = "float-typing";
  typingRow.innerHTML = `<div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  floatMessages.appendChild(typingRow);
  scrollFloatBottom();

  const reqId = ++latestRequest;

  try {
    const res = await fetch(apiUrl("/api/query"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: q,
        role: targetRole?.value || "general",
        answer_mode: "detailed",
        history: ragHistory,
      }),
    });

    document.getElementById("float-typing")?.remove();
    if (reqId !== latestRequest) return;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errRow = document.createElement("div");
      errRow.className = "chat-msg ai";
      errRow.innerHTML = `<div class="chat-bubble chat-bubble-error">${escapeHtml(err.error || "Could not process question.")}</div>`;
      floatMessages.appendChild(errRow);
      return;
    }

    const result = await res.json();
    if (reqId !== latestRequest) return;

    await addFloatAIBubble(result);

    ragHistory.push({
      question: result.query,
      answer: result.answer,
      topic: result.citations?.[0]?.section || result.trace?.intent,
      role: result.trace?.role,
    });
    ragHistory = ragHistory.slice(-4);

  } catch {
    document.getElementById("float-typing")?.remove();
    if (reqId === latestRequest) {
      const errRow = document.createElement("div");
      errRow.className = "chat-msg ai";
      errRow.innerHTML = `<div class="chat-bubble chat-bubble-error">Couldn't reach the backend. Try again.</div>`;
      floatMessages.appendChild(errRow);
    }
  }
}

floatForm?.addEventListener("submit", e => {
  e.preventDefault();
  submitFloatQuestion(floatInput?.value || "");
});

/* ── inline events ────────────────────────────────────────────────── */
ragForm.addEventListener("submit", e => {
  e.preventDefault();
  submitQuestion(ragInput.value);
});

suggestedWrap?.addEventListener("click", e => {
  const q = e.target.closest("[data-question]")?.dataset.question;
  if (q) { submitQuestion(q); return; }
  if (e.target.closest("#surprise-me")) {
    let idx;
    do { idx = Math.floor(Math.random() * SURPRISE_QUESTIONS.length); } while (idx === lastSurpriseIndex && SURPRISE_QUESTIONS.length > 1);
    lastSurpriseIndex = idx;
    submitQuestion(SURPRISE_QUESTIONS[idx]);
  }
});

clearBtn?.addEventListener("click", () => {
  ragHistory = [];
  chatMessages.innerHTML = `
    <div class="chat-msg ai">
      <div class="chat-bubble">
        <strong>Conversation cleared.</strong> Ask me anything about Karan's work.
      </div>
    </div>`;
  suggestionsUsed = false;
  suggestedWrap.style.cssText = "";
  ragInput.value = "";
  ragInput.focus();
});

returnBtn?.addEventListener("click", () => {
  document.getElementById("rag-lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  returnBtn.hidden = true;
});

document.addEventListener("click", e => {
  const link = e.target.closest("[data-project-question]");
  if (!link) return;
  e.preventDefault();
  document.getElementById("rag-lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  submitQuestion(link.dataset.projectQuestion);
});

/* ── lead capture ─────────────────────────────────────────────────── */
document.addEventListener("submit", async e => {
  const form = e.target.closest("#lead-form");
  if (!form) return;
  e.preventDefault();
  const name  = form.querySelector("[name=name]")?.value.trim() || "";
  const email = form.querySelector("[name=email]")?.value.trim() || "";
  const errEl = form.querySelector(".lead-error-msg");
  if (!email.includes("@")) {
    if (errEl) { errEl.textContent = "Valid email required."; errEl.hidden = false; }
    return;
  }
  const btn = form.querySelector(".lead-submit");
  btn.disabled = true; btn.textContent = "Sending…";
  if (errEl) errEl.hidden = true;
  try {
    const r = await fetch(apiUrl("/api/contact"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const d = await r.json();
    if (d.success) {
      form.closest(".lead-capture").innerHTML = `<p class="lead-success">Thanks${name ? " " + escapeHtml(name) : ""}! Karan will be in touch.</p>`;
    } else {
      btn.disabled = false; btn.textContent = "Send";
      if (errEl) { errEl.textContent = "Something went wrong."; errEl.hidden = false; }
    }
  } catch {
    btn.disabled = false; btn.textContent = "Send";
    if (errEl) { errEl.textContent = "Unable to send. Email karan.dee2905@gmail.com directly."; errEl.hidden = false; }
  }
});

/* ── injected styles ──────────────────────────────────────────────── */
(function () {
  const s = document.createElement("style");
  s.textContent = [
    ".lead-capture{margin-top:12px;padding:14px;border-radius:10px;background:#161b22;border:1px solid #21262d}",
    ".lead-intro{margin:0 0 10px;font-size:11px;color:var(--muted)}",
    ".lead-form{display:contents}",
    ".lead-fields{display:flex;gap:6px;flex-wrap:wrap}",
    ".lead-fields input{flex:1;min-width:130px;padding:8px 10px;border:1px solid #21262d;border-radius:6px;font-size:11px;background:#0d1117;color:var(--ink)}",
    ".lead-fields input:focus{outline:2px solid var(--accent);border-color:transparent}",
    ".lead-submit{padding:8px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer}",
    ".lead-submit:disabled{opacity:.55;cursor:not-allowed}",
    ".lead-success{font-size:11px;color:var(--green);font-weight:700;margin:0;padding:4px 0}",
    ".lead-error-msg{font-size:10px;color:var(--pink);margin:6px 0 0}",
  ].join("");
  document.head.appendChild(s);
}());

window.KaranAI = Object.freeze({});

/* ── status ───────────────────────────────────────────────────────── */
async function checkApiStatus() {
  try {
    const res = await fetch(apiUrl("/api/health"));
    if (!res.ok) throw new Error();
    backendWarm = true;
    if (apiStatus) apiStatus.textContent = "Live";
    const floatStatus = document.getElementById("float-chat-status");
    if (floatStatus) floatStatus.textContent = "Live";
  } catch {
    if (apiStatus) apiStatus.textContent = "Demo mode";
  }
}

async function loadSharedQuestion() {
  const q = new URLSearchParams(window.location.search).get("ask")?.trim();
  if (q) await submitQuestion(q);
}

checkApiStatus();
loadSharedQuestion();

// Keep-warm ping — prevents Render cold start
setInterval(() => {
  fetch(RAG_ENDPOINT.replace('/api/query', '/api/health')).catch(() => {});
}, 14 * 60 * 1000);