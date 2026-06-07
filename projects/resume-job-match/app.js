const skillCatalog = {
  "Machine learning": ["machine learning", "predictive modeling"],
  "Deep learning": ["deep learning", "neural network", "cnn", "lstm"],
  "NLP": ["nlp", "natural language processing", "transformer", "language model"],
  "Python": ["python"],
  "SQL": ["sql"],
  "PyTorch": ["pytorch"],
  "TensorFlow": ["tensorflow", "keras"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  "Spark": ["spark", "pyspark"],
  "FastAPI": ["fastapi"],
  "Docker": ["docker", "container"],
  "Kubernetes": ["kubernetes", "k8s"],
  "AWS": ["aws", "amazon web services"],
  "GCP": ["gcp", "google cloud"],
  "Azure": ["azure"],
  "MLOps": ["mlops", "model monitoring", "model deployment"],
  "Data pipelines": ["data pipeline", "etl", "workflow"],
  "Experimentation": ["a/b test", "experimentation", "hypothesis testing"],
  "Statistics": ["statistics", "statistical"],
  "Git": ["git", "github"],
  "CI/CD": ["ci/cd", "continuous integration"],
  "REST APIs": ["rest api", "restful", "api development"],
  "Communication": ["communication", "stakeholder", "cross-functional"],
  "Leadership": ["leadership", "mentor", "mentored", "led a team"]
};

const actionVerbs = ["built", "developed", "designed", "deployed", "improved", "reduced", "led", "created", "optimized", "achieved", "implemented", "engineered", "delivered", "increased"];
const productionTerms = ["production", "deploy", "monitor", "reliability", "latency", "api", "pipeline", "scale", "distributed", "cloud", "docker", "kubernetes", "ci/cd"];
const expectedSections = ["education", "experience", "skills", "project"];
const roleProfiles = {
  "ml-engineer": {
    label: "ML Engineer",
    skills: ["Machine learning", "Deep learning", "NLP", "Python", "SQL", "PyTorch", "TensorFlow", "Data pipelines", "FastAPI", "Docker", "MLOps"]
  },
  "data-scientist": {
    label: "Data Scientist",
    skills: ["Machine learning", "Python", "SQL", "Statistics", "Experimentation", "Scikit-learn", "Data pipelines", "Communication"]
  },
  "software-engineer": {
    label: "Software Engineer",
    skills: ["Python", "SQL", "Git", "REST APIs", "FastAPI", "Docker", "Data pipelines", "AWS", "GCP", "Leadership"]
  },
  "mlops-engineer": {
    label: "MLOps Engineer",
    skills: ["Python", "Docker", "Kubernetes", "MLOps", "CI/CD", "AWS", "GCP", "Data pipelines", "REST APIs", "Git"]
  }
};

const resumeFile = document.getElementById("resume-file");
const uploadTitle = document.getElementById("upload-title");
const uploadStatus = document.getElementById("upload-status");
const comparisonFile = document.getElementById("comparison-file");
const comparisonTitle = document.getElementById("comparison-title");
const comparisonStatus = document.getElementById("comparison-status");
const error = document.getElementById("form-error");
const roleButtons = document.querySelectorAll("[data-role]");
let selectedRole = "ml-engineer";
let currentResume = null;
let comparisonResume = null;

function normalize(text) {
  return text.toLowerCase().replace(/[^\w+#/.%-]+/g, " ").replace(/\s+/g, " ").trim();
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function detectedSkills(text) {
  const normalized = normalize(text);
  return Object.entries(skillCatalog)
    .filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))
    .map(([skill]) => skill);
}

function extractBullets(text) {
  const lines = text.split(/\n+/).map((line) => line.replace(/^[\s*\-]+/, "").trim()).filter(Boolean);
  return lines.filter((line) => line.length >= 45 && line.length <= 300).slice(0, 12);
}

function suggestRewrite(bullet) {
  const cleaned = bullet.replace(/\s+/g, " ").replace(/[.;,\s]+$/, "").trim();
  const withoutWeakLead = cleaned.replace(/^(worked on|helped with|responsible for|participated in)\s+/i, "");
  const normalized = normalize(cleaned);
  const hasAction = actionVerbs.some((verb) => normalized.startsWith(verb));
  const hasMetric = /\b\d+(?:\.\d+)?[%xkmb+]?\b/i.test(cleaned);
  const skills = detectedSkills(cleaned);
  const action = hasAction ? "" : "Delivered ";
  const context = skills.length ? ` using ${skills.slice(0, 2).join(" and ")}` : "";
  const outcome = hasMetric ? "" : ", resulting in [add truthful measurable outcome]";
  return `${action}${withoutWeakLead}${context}${outcome}.`;
}

function analyzeBullets(text) {
  return extractBullets(text).map((bullet) => {
    const normalized = normalize(bullet);
    const hasAction = actionVerbs.some((verb) => normalized.startsWith(verb) || normalized.includes(` ${verb} `));
    const hasMetric = /\b\d+(?:\.\d+)?[%xkmb+]?\b/i.test(bullet);
    const skills = detectedSkills(bullet);
    const score = clamp((hasAction ? 35 : 10) + (hasMetric ? 40 : 5) + Math.min(skills.length * 10, 25));
    const advice = [];
    if (!hasAction) advice.push("Lead with a specific action verb");
    if (!hasMetric) advice.push("add a truthful scale or measurable outcome");
    if (!skills.length) advice.push("name the relevant tool or technical method");
    return { bullet, score, advice: advice.length ? `${advice.join("; ")}.` : "Strong evidence: clear action, measurable outcome, and technical context.", rewrite: score < 75 ? suggestRewrite(bullet) : "" };
  }).sort((a, b) => b.score - a.score);
}

function analyzeSections(text) {
  const normalized = normalize(text);
  const sectionDefinitions = {
    summary: ["summary", "profile", "objective"],
    experience: ["experience", "employment", "work history"],
    projects: ["project", "portfolio"],
    skills: ["skills", "technologies", "technical"],
    education: ["education", "university", "college"]
  };
  return Object.entries(sectionDefinitions).map(([name, aliases]) => {
    const present = aliases.some((alias) => normalized.includes(alias));
    let score = present ? 65 : 0;
    if (name === "experience" && /\b\d+(?:\.\d+)?[%xkmb+]?\b/i.test(text)) score += 25;
    if (name === "projects" && detectedSkills(text).length >= 8) score += 20;
    if (name === "skills" && detectedSkills(text).length >= 10) score += 25;
    if (name === "education" && /(gpa|master|bachelor|university|college)/i.test(text)) score += 25;
    if (name === "summary" && present && /(engineer|scientist|developer|analyst)/i.test(text)) score += 25;
    return {
      name,
      present,
      score: clamp(score),
      note: present ? (score >= 85 ? "Present with strong supporting evidence." : "Present, but could carry clearer evidence.") : "Not clearly detected by the text parser."
    };
  });
}

function analyzeAts(text, pages) {
  const normalized = normalize(text);
  const checks = [
    { label: "Readable text layer", pass: text.length >= 500, detail: `${text.length.toLocaleString()} characters extracted successfully.` },
    { label: "Contact information", pass: /@/.test(text) && /\d{3}[\s)./-]*\d{3}[\s.-]*\d{4}/.test(text), detail: "Email and phone number should be machine-readable." },
    { label: "Standard headings", pass: expectedSections.filter((section) => normalized.includes(section)).length >= 3, detail: "Standard headings improve ATS section classification." },
    { label: "Resume length", pass: pages >= 1 && pages <= 2, detail: `${pages} page${pages === 1 ? "" : "s"} detected; one to two pages is typically ATS-friendly.` },
    { label: "Link visibility", pass: normalized.includes("linkedin") || normalized.includes("github"), detail: "Include visible LinkedIn or GitHub labels." },
    { label: "Character cleanliness", pass: !/[�]/.test(text), detail: "No replacement characters should appear in extracted text." }
  ];
  return { checks, score: clamp((checks.filter((check) => check.pass).length / checks.length) * 100) };
}

function analyzeResume(text, pages, roleKey) {
  const normalized = normalize(text);
  const skills = detectedSkills(text);
  const bullets = analyzeBullets(text);
  const metrics = text.match(/\b\d+(?:\.\d+)?[%xkmb+]?\b/gi) || [];
  const presentSections = expectedSections.filter((section) => normalized.includes(section));
  const actionsUsed = actionVerbs.filter((verb) => normalized.includes(verb));
  const productionEvidence = productionTerms.filter((term) => normalized.includes(term));
  const profile = roleProfiles[roleKey];
  const roleMatches = profile.skills.filter((skill) => skills.includes(skill));
  const roleGaps = profile.skills.filter((skill) => !skills.includes(skill));
  const roleScore = clamp((roleMatches.length / profile.skills.length) * 100);
  const sections = analyzeSections(text);
  const ats = analyzeAts(text, pages);

  const structureScore = clamp(presentSections.length * 18 + (normalized.includes("@") ? 14 : 0) + (normalized.includes("linkedin") ? 14 : 0));
  const impactScore = clamp(metrics.length * 7 + bullets.filter((bullet) => bullet.score >= 75).length * 6);
  const writingScore = clamp((actionsUsed.length / 8) * 100);
  const productionScore = clamp(productionEvidence.length * 9);
  const overall = clamp(structureScore * .15 + ats.score * .15 + roleScore * .25 + impactScore * .2 + writingScore * .15 + productionScore * .1);

  const strengths = [];
  if (metrics.length >= 6) strengths.push(`${metrics.length} measurable impact signals`);
  if (skills.length >= 10) strengths.push(`${skills.length} explicit technical skills`);
  if (actionsUsed.length >= 5) strengths.push("Action-oriented achievement writing");
  if (productionEvidence.length >= 5) strengths.push("Strong production engineering evidence");
  if (presentSections.length >= 3) strengths.push("Clear core resume sections");
  if (roleScore >= 70) strengths.push(`${profile.label} skill alignment`);

  const gaps = [];
  if (!normalized.includes("summary")) gaps.push("Professional summary");
  if (metrics.length < 6) gaps.push("More quantified outcomes");
  if (productionEvidence.length < 5) gaps.push("Production ownership evidence");
  if (!normalized.includes("project")) gaps.push("Projects section");
  if (!normalized.includes("github")) gaps.push("GitHub link");
  roleGaps.slice(0, 3).forEach((gap) => gaps.push(`${profile.label}: ${gap}`));

  const recommendations = [];
  if (!normalized.includes("summary")) recommendations.push("Add a concise professional summary that states your target role, strongest ML specialty, and scale of impact.");
  if (metrics.length < 6) recommendations.push("Quantify more experience bullets using scale, accuracy, latency, cost, adoption, or revenue outcomes.");
  if (productionEvidence.length < 5) recommendations.push("Make production ownership explicit through deployment, monitoring, reliability, or operational metrics.");
  if (bullets.some((bullet) => bullet.score < 50)) recommendations.push("Rewrite the weakest bullets to begin with an action and end with a truthful measurable outcome.");
  if (!normalized.includes("github")) recommendations.push("Add a visible GitHub link so recruiters can inspect your engineering work.");
  if (roleGaps.length) recommendations.push(`For ${profile.label} roles, add truthful evidence for: ${roleGaps.slice(0, 4).join(", ")}.`);
  if (!recommendations.length) recommendations.push("The resume is strong. Keep the most relevant achievements near the top and tailor the summary for each role.");

  return { overall, structureScore, atsScore: ats.score, roleScore, impactScore, writingScore, productionScore, skills, strengths, gaps, recommendations, bullets, metrics, presentSections, actionsUsed, productionEvidence, roleMatches, roleGaps, roleLabel: profile.label, sections, atsChecks: ats.checks };
}

function scoreLabel(score) {
  if (score >= 85) return "Excellent resume foundation";
  if (score >= 70) return "Strong resume foundation";
  if (score >= 50) return "Good evidence, needs refinement";
  return "Needs stronger evidence";
}

function renderChips(targetId, items, emptyMessage) {
  document.getElementById(targetId).innerHTML = items.length
    ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : `<span>${emptyMessage}</span>`;
}

function renderReport(result) {
  document.getElementById("empty-state").hidden = true;
  document.getElementById("report").hidden = false;
  document.getElementById("match-score").textContent = result.overall;
  document.getElementById("score-ring").style.setProperty("--score", `${result.overall * 3.6}deg`);
  document.getElementById("match-label").textContent = scoreLabel(result.overall);
  document.getElementById("match-summary").textContent = `${result.roleScore}% readiness for ${result.roleLabel}, with ${result.atsScore}% ATS compatibility and ${result.metrics.length} measurable impact signals.`;

  const scores = [
    ["Structure", result.structureScore],
    ["ATS compatibility", result.atsScore],
    [`${result.roleLabel} readiness`, result.roleScore],
    ["Impact evidence", result.impactScore],
    ["Action writing", result.writingScore]
  ];
  document.getElementById("score-grid").innerHTML = scores.map(([label, score]) => `<div class="score-card"><span>${label}</span><strong>${score}%</strong><div class="score-track"><i style="width:${score}%"></i></div></div>`).join("");

  document.getElementById("matched-count").textContent = result.strengths.length;
  document.getElementById("missing-count").textContent = result.gaps.length;
  renderChips("matched-skills", result.strengths, "Upload a detailed resume to detect strengths");
  renderChips("missing-skills", result.gaps, "No major gaps detected");
  document.getElementById("recommendation-list").innerHTML = result.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.getElementById("section-grid").innerHTML = result.sections.map((section) => `<div class="section-card"><div><strong>${escapeHtml(section.name)}</strong><span>${section.score}%</span></div><p>${escapeHtml(section.note)}</p></div>`).join("");
  document.getElementById("ats-score").textContent = `${result.atsScore}% compatible`;
  document.getElementById("ats-list").innerHTML = result.atsChecks.map((check) => `<div class="ats-item ${check.pass ? "" : "warning"}"><i></i><div><strong>${escapeHtml(check.label)}</strong><p>${escapeHtml(check.detail)}</p></div><span>${check.pass ? "Pass" : "Review"}</span></div>`).join("");

  document.getElementById("bullet-count").textContent = `${result.bullets.length} bullets reviewed`;
  document.getElementById("bullet-list").innerHTML = result.bullets.length
    ? result.bullets.slice(0, 8).map((item) => `<div class="bullet-item"><div class="bullet-topline"><span>${item.score}/100</span><strong>${item.score >= 75 ? "Strong evidence" : item.score >= 50 ? "Developing" : "Needs work"}</strong></div><p>${escapeHtml(item.bullet)}</p><small>${escapeHtml(item.advice)}</small>${item.rewrite ? `<div class="bullet-rewrite"><span>Evidence-safe rewrite</span><p>${escapeHtml(item.rewrite)}</p></div>` : ""}</div>`).join("")
    : `<div class="bullet-item"><p>No achievement bullets detected.</p><small>Use separate lines beginning with action-oriented achievement statements.</small></div>`;

  const evidence = [
    ["Role fit", `${result.roleMatches.length} of ${result.roleMatches.length + result.roleGaps.length} expected ${result.roleLabel} skills were detected.`],
    ["Skills", `${result.skills.length} explicit technical skills were detected: ${result.skills.slice(0, 8).join(", ")}${result.skills.length > 8 ? ", and more" : ""}.`],
    ["Impact", `${result.metrics.length} numerical signals and ${result.bullets.filter((bullet) => bullet.score >= 75).length} strong evidence bullets were detected.`],
    ["Structure", `${result.presentSections.length} core sections were recognized: ${result.presentSections.join(", ") || "none"}.`],
    ["Writing", `${result.actionsUsed.length} strong action verbs and ${result.productionEvidence.length} production terms were found.`],
    ["Method", "The score is deterministic and evidence-based; it does not invent experience or use an external AI service."]
  ];
  document.getElementById("evidence-list").innerHTML = evidence.map(([label, copy]) => `<div class="evidence-row"><strong>${label}</strong><p>${escapeHtml(copy)}</p></div>`).join("");
  if (comparisonResume) renderComparison(result, analyzeResume(comparisonResume.text, comparisonResume.pages, selectedRole));
}

function renderComparison(before, after) {
  const review = document.getElementById("comparison-review");
  review.hidden = false;
  const delta = after.overall - before.overall;
  document.getElementById("comparison-label").textContent = `${delta >= 0 ? "+" : ""}${delta} overall`;
  document.getElementById("comparison-summary").innerHTML = `<strong>${delta >= 0 ? "+" : ""}${delta}</strong><p>${delta > 0 ? "The revised resume improved its overall evidence score." : delta < 0 ? "The revised resume scores lower; review the dimensions below." : "The overall score is unchanged, but individual dimensions may have moved."}</p>`;
  const dimensions = [
    ["Overall quality", before.overall, after.overall],
    [`${before.roleLabel} readiness`, before.roleScore, after.roleScore],
    ["ATS compatibility", before.atsScore, after.atsScore],
    ["Impact evidence", before.impactScore, after.impactScore],
    ["Action writing", before.writingScore, after.writingScore],
    ["Strong bullets", before.bullets.filter((bullet) => bullet.score >= 75).length, after.bullets.filter((bullet) => bullet.score >= 75).length]
  ];
  document.getElementById("comparison-grid").innerHTML = dimensions.map(([label, first, second]) => {
    const change = second - first;
    return `<div class="comparison-card"><div><span>${escapeHtml(label)}</span><strong>${change >= 0 ? "+" : ""}${change}</strong></div><p>${first} to ${second}</p></div>`;
  }).join("");
}

async function extractPdfData(file, titleElement, statusElement) {
  error.textContent = "";
  if (!file || file.type !== "application/pdf") {
    error.textContent = "Choose a PDF resume.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.textContent = "The PDF must be smaller than 5MB.";
    return;
  }
  titleElement.textContent = "Extracting and analyzing...";
  statusElement.textContent = file.name;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const response = await fetch("/api/extract-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_base64: btoa(binary) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "PDF extraction failed");
    titleElement.textContent = file.name;
    statusElement.textContent = `${result.pages} page${result.pages === 1 ? "" : "s"} · ${result.characters.toLocaleString()} characters · analysis complete`;
    return { text: result.text, pages: result.pages };
  } catch (requestError) {
    titleElement.textContent = "Upload resume PDF";
    statusElement.textContent = "Could not analyze this PDF";
    error.textContent = requestError.message;
    return null;
  }
}

resumeFile.addEventListener("change", async (event) => {
  const extracted = await extractPdfData(event.target.files?.[0], uploadTitle, uploadStatus);
  if (!extracted) return;
  currentResume = extracted;
  renderReport(analyzeResume(extracted.text, extracted.pages, selectedRole));
  document.getElementById("results-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});
comparisonFile.addEventListener("change", async (event) => {
  if (!currentResume) {
    error.textContent = "Upload the original resume before adding a revised version.";
    comparisonFile.value = "";
    return;
  }
  const extracted = await extractPdfData(event.target.files?.[0], comparisonTitle, comparisonStatus);
  if (!extracted) return;
  comparisonResume = extracted;
  renderReport(analyzeResume(currentResume.text, currentResume.pages, selectedRole));
  document.getElementById("comparison-review").scrollIntoView({ behavior: "smooth", block: "center" });
});
roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRole = button.dataset.role;
    roleButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    if (currentResume) renderReport(analyzeResume(currentResume.text, currentResume.pages, selectedRole));
  });
});

window.RoleFit = Object.freeze({ analyzeResume, suggestRewrite, renderComparison });
