/* ─── projects.js ─────────────────────────────────────────────────
   Experience collapsible cards, project toggles, case study modal.
   Depends on: nav.js (updateActiveNavigation function, global via function declaration)
   ─────────────────────────────────────────────────────────────── */

const projectToggles = document.querySelectorAll(".project-toggle");
const projectDemoLinks = document.querySelectorAll(".project-action-primary[href^='#']");
const projectAiQuestions = {
  "project-cloud-infrastructure": "Tell me about the AWS Three-Tier Book Application.",
  "project-sentinel": "Tell me about the High-Risk Counterparty Prediction project.",
  "project-speech": "Tell me about the Speech Emotion Detection project.",
  "project-portfolio-ai": "Tell me about the AI Portfolio Assistant.",
  "project-rolefit": "Tell me about the RoleFit Resume Analyzer.",
  "project-gitops-todo": "Tell me about the EKS GitOps Todo Application."
};
const caseStudyModal = document.getElementById("case-study-modal");
const caseStudyDialog = caseStudyModal.querySelector(".case-study-dialog");
const caseStudyClose = caseStudyModal.querySelector(".case-study-close");
const caseStudyTitle = document.getElementById("case-study-title");
const caseStudyTag = document.getElementById("case-study-tag");
const caseStudyResults = document.getElementById("case-study-results");
const caseStudyContent = document.getElementById("case-study-content");
const caseStudyFooter = document.getElementById("case-study-footer");
let caseStudyTrigger = null;

document.querySelectorAll(".project-card").forEach((card) => {
  const question = projectAiQuestions[card.id];
  const actions = card.querySelector(".project-actions");
  if (!question || !actions) return;
  const link = document.createElement("a");
  link.className = "project-ai-question";
  link.href = `?ask=${encodeURIComponent(question)}#rag-lab`;
  link.dataset.projectQuestion = question;
  link.setAttribute("aria-label", `Ask Karan AI about ${card.querySelector("h3").textContent}`);
  link.innerHTML = `Questions? Ask Karan AI about this project <span>&rarr;</span>`;
  actions.append(link);
});

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
    const launchLinks = [...card.querySelectorAll(".project-actions a")];
    caseStudyTrigger = toggle;
    caseStudyTitle.textContent = card.querySelector("h3").textContent;
    caseStudyTag.textContent = card.querySelector(".project-tag").textContent;
    caseStudyResults.innerHTML = card.querySelector(".project-results").innerHTML;
    caseStudyContent.innerHTML = card.querySelector(".project-details").innerHTML;
    caseStudyFooter.innerHTML = launchLinks.map(link => link.outerHTML).join("");
    caseStudyModal.classList.add("open");
    caseStudyModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => caseStudyClose.focus(), 0);
  });
});
document.querySelectorAll(".experience-card:not(.experience-primary)").forEach((card, index) => {
  card.classList.add("experience-collapsible");
  const role = card.querySelector(".experience-role");
  const impact = card.querySelector(".experience-impact");
  if (!role || !impact) return;
  const detailsId = `experience-details-${index + 1}`;
  role.id = detailsId;
  role.hidden = true;
  impact.hidden = true;
  const button = document.createElement("button");
  button.className = "experience-toggle";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", detailsId);
  button.textContent = "View impact";
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.textContent = expanded ? "View impact" : "Hide impact";
    role.hidden = expanded;
    impact.hidden = expanded;
  });
  card.append(button);
});
caseStudyModal.querySelectorAll("[data-close-case-study]").forEach((button) => button.addEventListener("click", closeCaseStudy));
caseStudyFooter.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (link && (link.getAttribute("href")?.startsWith("#") || link.dataset.projectQuestion)) closeCaseStudy();
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
      top: target.offsetTop - document.querySelector(".site-header").offsetHeight,
      behavior: "auto"
    });
    updateActiveNavigation();
  });
});
