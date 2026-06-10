const main = document.querySelector("main");
const heroSection = document.querySelector(".hero");
const aiSection = document.getElementById("rag-lab");
const experienceSection = document.getElementById("experience");
const projectsSection = document.getElementById("projects");
const skillsSection = document.getElementById("skills");
if (main && heroSection && aiSection && experienceSection && projectsSection && skillsSection) {
  heroSection.after(experienceSection);
  experienceSection.after(projectsSection);
  projectsSection.after(aiSection);
  aiSection.after(skillsSection);
}

const header = document.querySelector(".site-header");
const reveals = document.querySelectorAll(".reveal");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuLinks = mobileMenu.querySelectorAll("a");
const sectionLinks = document.querySelectorAll('a[href^="#"]');
const trackedSections = document.querySelectorAll("main section[id]");
const counters = document.querySelectorAll("[data-count]");
const themeToggles = document.querySelectorAll(".theme-toggle, .mobile-theme-toggle");
const configuredApiUrl = document.querySelector('meta[name="portfolio-api-url"]')?.content?.replace(/\/$/, "") || "";
const isLocalPortfolio = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = isLocalPortfolio ? "" : configuredApiUrl;
const apiUrl = (path) => `${API_BASE_URL}${path}`;

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
  if (window.innerWidth > 980) closeMobileMenu();
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

const skillKnowledge = {
  Python: ["A general-purpose language widely used for backend services, automation, data, and ML.", "My primary language for ML experimentation, data workflows, APIs, and portfolio AI tooling."],
  "C++": ["A compiled systems language designed for high performance and precise resource control.", "Used for performance-sensitive systems work, debugging, profiling, and concurrent engineering."],
  Java: ["A strongly typed language commonly used for large-scale backend and distributed applications.", "Used for service-oriented software and data-processing systems."],
  JavaScript: ["The core programming language of interactive web applications.", "Used to build the behavior and interactions across this portfolio."],
  TypeScript: ["JavaScript with static types for safer, more maintainable applications.", "Used for structured product interfaces and full-stack application development."],
  SQL: ["The standard language for querying and transforming relational data.", "Used across analytics, data pipelines, feature work, and relational databases."],
  Kafka: ["A distributed event-streaming platform for high-throughput, real-time data.", "Relevant to scalable event-driven services and streaming data pipelines."],
  gRPC: ["A high-performance framework for typed service-to-service communication.", "Used for efficient communication patterns between distributed backend services."],
  "REST APIs": ["HTTP interfaces that let applications exchange resources through standard operations.", "Used to connect product interfaces, backend services, and ML capabilities."],
  Microservices: ["An architecture that divides a system into independently deployable services.", "Applied when designing scalable backend and cloud systems with clear ownership boundaries."],
  PyTorch: ["A deep-learning framework for building and training neural networks.", "Used in applied ML research, model experimentation, and NLP workflows."],
  TensorFlow: ["A framework for training and deploying machine-learning models.", "Used for deep-learning experimentation and production-oriented ML workflows."],
  "Scikit-learn": ["A Python library for classical machine learning, preprocessing, and evaluation.", "Used for predictive modeling, baselines, feature pipelines, and model evaluation."],
  "Hugging Face": ["An ecosystem of pretrained models, datasets, and tools for modern AI.", "Used to work with transformer models and applied NLP experiments."],
  Transformers: ["Neural-network architectures that model relationships across sequences.", "Used for language modeling, persuasion research, and retrieval-oriented AI products."],
  LoRA: ["A parameter-efficient method for adapting large pretrained models.", "Used to explore efficient fine-tuning without retraining every model parameter."],
  NLP: ["Machine learning focused on understanding and generating human language.", "Applied in persuasion research, language analysis, and portfolio AI experiences."],
  "Deep Learning": ["Machine learning based on multi-layer neural networks.", "Used for NLP, speech-related systems, and representation-learning experiments."],
  "Model Evaluation": ["The process of measuring model quality, reliability, and failure modes.", "Used to compare experiments and validate retrieval and predictive-model behavior."],
  "Predictive Modeling": ["Using historical data to estimate future outcomes or classes.", "Applied to risk-oriented analysis, research, and data-driven product work."],
  Spark: ["A distributed engine for processing large datasets across clusters.", "Used for large-scale data pipelines and billion-scale behavioral-data processing."],
  Hive: ["A SQL-oriented data warehouse layer for large distributed datasets.", "Used to query and organize large analytical datasets."],
  HDFS: ["A distributed file system built to store very large datasets across machines.", "Used as part of large-scale data engineering and distributed processing workflows."],
  PostgreSQL: ["An open-source relational database known for reliability and advanced SQL features.", "Used as a dependable persistence layer for backend and product systems."],
  MySQL: ["A widely used relational database for structured application data.", "Used for transactional application storage and SQL-based development."],
  MongoDB: ["A document database for flexible, JSON-like application data.", "Used where product data benefits from a flexible document structure."],
  Redis: ["An in-memory data store commonly used for caching and fast state access.", "Used to improve backend responsiveness and support real-time application patterns."],
  Tableau: ["A visual analytics platform for exploring and presenting data.", "Used to communicate analytical findings through dashboards and visualizations."],
  "Power BI": ["A business-intelligence platform for data modeling and dashboards.", "Used to turn structured data into accessible analytical reporting."],
  AWS: ["Amazon's cloud platform for compute, networking, storage, databases, and managed services.", "Used in the three-tier resilient architecture and EKS GitOps portfolio projects."],
  GCP: ["Google's cloud platform for infrastructure, data, and ML services.", "Used for scalable workloads, data workflows, and production ML environments."],
  Docker: ["A platform for packaging applications and dependencies into portable containers.", "Used to make services reproducible across development, CI, and deployment."],
  Kubernetes: ["A platform for deploying, scaling, and operating containerized applications.", "Used in the EKS GitOps project and multi-node production environments."],
  Terraform: ["Infrastructure-as-code tooling for provisioning cloud resources declaratively.", "Used to define repeatable AWS infrastructure for portfolio cloud projects."],
  "GitHub Actions": ["GitHub's automation platform for continuous integration and delivery.", "Used to automate testing, builds, and deployment workflows."],
  "CI/CD": ["Practices that automate software integration, testing, and deployment.", "Used to ship application and infrastructure changes reliably."],
  Linux: ["An operating-system family that powers most cloud and server environments.", "Used for development, deployment, systems debugging, and production operations."],
  GDB: ["A debugger for inspecting compiled programs while they run.", "Used to diagnose low-level C++ behavior and correctness issues."],
  Valgrind: ["A suite for finding memory errors and profiling native programs.", "Used to investigate memory safety and resource-management problems."],
  perf: ["Linux performance-analysis tooling for profiling CPU and system behavior.", "Used to identify performance bottlenecks in systems workloads."],
  "W&B": ["Weights & Biases is a platform for tracking and comparing ML experiments.", "Used to monitor training runs, metrics, and model experiments."]
};

Object.assign(skillKnowledge, {
  RAG: ["Retrieval-augmented generation grounds responses in relevant source material.", "Used in Karan AI to retrieve portfolio evidence before composing answers."],
  Analytics: ["The practice of turning data into measurable insights and decisions.", "Used in Meta pipelines, behavioral analysis, dashboards, and product evaluation."],
  "Data Pipelines": ["Automated workflows that move and transform data between systems.", "Built for large-scale behavioral data, analytics, and dependable downstream reporting."],
  Dashboards: ["Visual interfaces that summarize metrics, trends, and operational signals.", "Built to make analytical results and system behavior easier to monitor and act on."],
  "Llama 2-7B": ["A seven-billion-parameter open language model from Meta's Llama 2 family.", "Fine-tuned and evaluated in persuasion-modeling research."],
  DPO: ["Direct Preference Optimization aligns a language model using preferred and rejected responses.", "Used in persuasion research to optimize responses from human preference data."],
  Qualtrics: ["A platform for building surveys and collecting structured human feedback.", "Used to gather human evaluations for persuasion-modeling experiments."],
  Consensus: ["A distributed-systems process for nodes to agree on shared state.", "Taught while guiding students through reliability and distributed-systems trade-offs."],
  Replication: ["Maintaining multiple copies of data or services for reliability and availability.", "Taught as a core distributed-systems technique for fault-tolerant services."],
  React: ["A JavaScript library for building component-based user interfaces.", "Used across the three-tier book app, speech product, and GitOps Todo application."],
  "Node.js": ["A JavaScript runtime for building server-side applications.", "Used for the application layer of the AWS three-tier book system."],
  Express: ["A lightweight Node.js framework for web servers and APIs.", "Used to implement REST CRUD endpoints in the three-tier book application."],
  "Model Benchmarking": ["Systematically comparing candidate models under the same evaluation design.", "Used in Sentinel to select the strongest measured risk-ranking model."],
  "Temporal Validation": ["Evaluating a model on later time periods to better represent future behavior.", "Used in Sentinel to reduce leakage and test performance on a strict temporal holdout."],
  "Probability Calibration": ["Aligning predicted probabilities with observed outcome frequencies.", "Used in Sentinel so risk scores are more interpretable and actionable."],
  "Local Explanations": ["Per-prediction explanations showing which inputs influenced a model output.", "Used in Sentinel to make individual counterparty risk scores inspectable."],
  IPW: ["Inverse propensity weighting adjusts analysis for unequal treatment or selection probabilities.", "Used in Sentinel's intervention analysis workflow."],
  Keras: ["A high-level deep-learning API for designing and training neural networks.", "Used to build the speech emotion classifier."],
  Librosa: ["A Python library for audio analysis and feature extraction.", "Used to extract speech features such as MFCCs, chroma, RMS, and mel spectrograms."],
  FastAPI: ["A Python framework for fast, typed web APIs.", "Used to serve speech inference and product endpoints."],
  "Framer Motion": ["An animation library for React interfaces.", "Used to create polished interactions in the speech emotion product."],
  "Evidence Retrieval": ["Finding the most relevant trusted passages before generating an answer.", "Used by the portfolio assistant to ground answers in verified portfolio content."],
  "Confidence Gate": ["A rule that withholds an answer when retrieved evidence is too weak.", "Used by the portfolio assistant to avoid unsupported claims."],
  Citations: ["References that show which source material supports an answer.", "Used by the portfolio assistant so recruiters can inspect the evidence behind responses."],
  Conversation: ["A multi-turn interaction where later questions can build on earlier context.", "Used by Karan AI to answer natural follow-up questions without making recruiters repeat the full topic."],
  "PDF Parsing": ["Extracting structured or plain text from PDF documents.", "Used in RoleFit to analyze uploaded resumes."],
  "Evidence-Safe Rewrites": ["Suggested wording improvements that preserve the facts present in source material.", "Used in RoleFit to improve resume bullets without inventing achievements or metrics."],
  CircleCI: ["A continuous-integration platform that automates builds, tests, and delivery workflows.", "Used to build and publish versioned images for the EKS GitOps Todo application."],
  "Argo CD": ["A GitOps delivery tool that continuously synchronizes Kubernetes state from Git.", "Used to deploy manifest changes into the EKS cluster."],
  "Amazon EKS": ["AWS's managed Kubernetes service.", "Used as the deployment target for the GitOps Todo application."],
  "Recruiter question": ["The natural-language request that begins the assistant workflow.", "Used as the input the portfolio assistant interprets and answers."],
  "Portfolio retrieval": ["Searching trusted portfolio content for evidence relevant to a question.", "Used to ground assistant responses in experience, projects, skills, and resume content."],
  "Confidence gate": ["A rule that withholds an answer when retrieved evidence is too weak.", "Used by the portfolio assistant to avoid unsupported claims."],
  "Cited answer": ["A generated response paired with the evidence supporting it.", "Used as the final output of the portfolio assistant."]
});

Object.assign(skillKnowledge, {
  "Machine Learning": ["The practice of building systems that learn patterns from data.", "Studied and applied through predictive modeling, deep learning, NLP, evaluation, and product-focused ML projects."],
  "Distributed Systems": ["Software systems whose components coordinate across multiple machines.", "Studied, researched, and taught through work on communication, replication, consensus, fault tolerance, and performance."]
});

const contextSkillUsage = {
  "experience-meta": {
    Python: "Built and optimized large-scale behavioral-data pipelines processing 1.2B user pairs.",
    SQL: "Queried and transformed product data used for behavioral analysis and decision-making.",
    "Data Pipelines": "Improved pipeline performance by 5x while supporting analysis across 500M users.",
    Dashboards: "Presented product and experiment insights so cross-functional teams could act on the results."
  },
  "experience-systems-research": {
    "C++": "Built performance-sensitive distributed services and improved throughput through multithreading and asynchronous processing.",
    Python: "Supported service automation, experimentation, and distributed-systems workflows.",
    Kafka: "Enabled reliable asynchronous communication between distributed services.",
    gRPC: "Implemented efficient typed communication between backend services.",
    Docker: "Packaged services into reproducible environments for multi-node deployment and testing."
  },
  "experience-persuasion": {
    "Llama 2-7B": "Served as the base language model for persuasion-modeling experiments.",
    LoRA: "Efficiently fine-tuned the language model without updating every parameter.",
    DPO: "Aligned generated responses using preferred and rejected persuasion examples.",
    Qualtrics: "Collected structured human evaluations used to compare persuasive responses."
  },
  "experience-teaching": {
    Python: "Used in examples and student projects to teach distributed-system behavior and debugging.",
    "C++": "Used to teach performance, concurrency, and systems-level debugging.",
    Consensus: "Taught as a core mechanism for keeping distributed nodes in agreement.",
    Replication: "Taught as a reliability technique for fault tolerance and availability."
  },
  "project-cloud-infrastructure": {
    React: "Built the presentation layer of the three-tier book application.",
    "Node.js": "Ran the backend application layer that connects the UI and database.",
    Express: "Implemented the REST CRUD endpoints for managing books.",
    MySQL: "Stored the application's structured book data in the database tier.",
    AWS: "Provided the deployment architecture for the frontend, API, database, and warm-standby recovery design."
  },
  "project-sentinel": {
    "Model Benchmarking": "Compared three candidate models under the same leakage-safe evaluation design.",
    "Temporal Validation": "Tested the selected model on later months to represent future production behavior.",
    "Probability Calibration": "Made predicted risk scores better match observed outcome frequencies.",
    "Local Explanations": "Exposed the factors influencing each counterparty risk score.",
    IPW: "Supported intervention analysis while accounting for unequal treatment probabilities."
  },
  "project-speech": {
    Keras: "Defined and trained the CNN-BiLSTM-Attention speech emotion classifier.",
    Librosa: "Extracted MFCC, chroma, RMS, ZCR, and mel-spectrogram audio features.",
    FastAPI: "Validated audio uploads and served emotion predictions to the product interface.",
    React: "Built the recording, prediction, playback, and editable journal experience.",
    "Framer Motion": "Added lightweight interaction polish to the speech journaling interface."
  },
  "project-portfolio-ai": {
    Python: "Powers the retrieval service, question routing, answer generation, and evaluation suite.",
    "Evidence Retrieval": "Finds the strongest verified portfolio passages for each recruiter question.",
    "Confidence Gate": "Prevents the assistant from presenting unsupported portfolio claims.",
    Conversation: "Carries the relevant topic into genuine follow-up questions while keeping unrelated questions independent."
  },
  "project-rolefit": {
    JavaScript: "Runs the interactive scoring, ATS analysis, and before-and-after resume workspace.",
    Python: "Supports backend PDF extraction and portfolio service integration.",
    "PDF Parsing": "Extracts resume text from uploaded PDF files for analysis.",
    "Evidence-Safe Rewrites": "Improves resume bullets while preserving the candidate's verified facts."
  },
  "project-gitops-todo": {
    React: "Provides the containerized Todo application's user interface.",
    Docker: "Packages the application into a versioned, deployable image.",
    CircleCI: "Tests the application, builds its image, and updates the deployment manifest.",
    "Argo CD": "Continuously synchronizes the manifest repository with the Kubernetes cluster.",
    "Amazon EKS": "Runs the Kubernetes workloads and keeps the deployed application available."
  }
};

const roleKnowledge = {
  "Software Engineering": {
    interest: "I enjoy turning complex requirements into reliable products and improving systems through careful engineering.",
    expertise: "Meta-scale pipelines, distributed-systems research, full-stack products, APIs, performance optimization, and production delivery."
  },
  "Machine Learning": {
    interest: "I am interested in building models whose quality can be measured, explained, and connected to real user workflows.",
    expertise: "Speech emotion modeling, persuasion research, predictive risk ranking, model evaluation, calibration, and explainability."
  },
  "Backend Engineering": {
    interest: "I enjoy designing the reliable services and data flows that make products fast, scalable, and dependable.",
    expertise: "Meta-scale pipelines, C++ distributed services, Kafka, gRPC, REST APIs, FastAPI, databases, Docker, Kubernetes, and cloud delivery."
  },
  "Applied AI": {
    interest: "I want to build AI features that are useful in practice, grounded in evidence, and dependable beyond a demo.",
    expertise: "Portfolio AI retrieval and evaluation, RoleFit resume analysis, NLP research, confidence gating, and cited responses."
  }
};

const skillTooltip = document.createElement("div");
skillTooltip.className = "skill-tooltip";
skillTooltip.id = "skill-tooltip";
skillTooltip.setAttribute("role", "tooltip");
skillTooltip.setAttribute("aria-hidden", "true");
document.body.appendChild(skillTooltip);
let activeSkill = null;

function positionSkillTooltip(chip) {
  const chipBox = chip.getBoundingClientRect();
  const tooltipBox = skillTooltip.getBoundingClientRect();
  const gap = 10;
  const left = Math.min(Math.max(14, chipBox.left + chipBox.width / 2 - tooltipBox.width / 2), window.innerWidth - tooltipBox.width - 14);
  const above = chipBox.top - tooltipBox.height - gap;
  const top = above > 14 ? above : Math.min(window.innerHeight - tooltipBox.height - 14, chipBox.bottom + gap);
  skillTooltip.style.left = `${left}px`;
  skillTooltip.style.top = `${Math.max(14, top)}px`;
}

function showSkillTooltip(chip) {
  const skill = normalizedSkillKnowledge.get((chip.dataset.skillName || chip.textContent.trim()).toLowerCase());
  if (!skill) return;
  const detail = skill.detail;
  const contextId = chip.closest("[id]")?.id;
  const contextualUsage = contextSkillUsage[contextId]?.[skill.name] || detail[1];
  activeSkill?.classList.remove("skill-active");
  activeSkill = chip;
  chip.classList.add("skill-active");
  skillTooltip.innerHTML = `<strong>${skill.name}</strong><span>What it is</span><p>${detail[0]}</p><span>${contextSkillUsage[contextId] ? "How I used it here" : "Where I use it"}</span><p>${contextualUsage}</p>`;
  skillTooltip.setAttribute("aria-hidden", "false");
  skillTooltip.classList.add("visible");
  positionSkillTooltip(chip);
}

function showRoleTooltip(role) {
  const detail = roleKnowledge[role.textContent.trim()];
  if (!detail) return;
  activeSkill?.classList.remove("skill-active");
  activeSkill = role;
  role.classList.add("skill-active");
  skillTooltip.innerHTML = `<strong>${role.textContent.trim()}</strong><span>Why I am interested</span><p>${detail.interest}</p><span>Relevant expertise</span><p>${detail.expertise}</p>`;
  skillTooltip.setAttribute("aria-hidden", "false");
  skillTooltip.classList.add("visible");
  positionSkillTooltip(role);
}

function hideSkillTooltip() {
  activeSkill?.classList.remove("skill-active");
  activeSkill = null;
  skillTooltip.classList.remove("visible");
  skillTooltip.setAttribute("aria-hidden", "true");
}

const normalizedSkillKnowledge = new Map(Object.entries(skillKnowledge).map(([name, detail]) => [name.toLowerCase(), { name, detail }]));
document.querySelectorAll(".skill-chips span, .experience-tags span, .project-stack span, .capability-tags span, .architecture-flow span, .coursework span").forEach((chip) => {
  const skill = normalizedSkillKnowledge.get(chip.textContent.trim().toLowerCase());
  if (!skill) return;
  chip.dataset.skillName = skill.name;
  chip.classList.add("context-term");
  chip.tabIndex = 0;
  chip.setAttribute("role", "button");
  chip.setAttribute("aria-describedby", "skill-tooltip");
  chip.setAttribute("aria-label", `${chip.textContent.trim()}: show context`);
  chip.addEventListener("mouseenter", () => showSkillTooltip(chip));
  chip.addEventListener("mouseleave", hideSkillTooltip);
  chip.addEventListener("focus", () => showSkillTooltip(chip));
  chip.addEventListener("blur", hideSkillTooltip);
  chip.addEventListener("click", (event) => {
    event.stopPropagation();
    showSkillTooltip(chip);
  });
});

document.querySelectorAll(".contact-focus strong").forEach((role) => {
  if (!roleKnowledge[role.textContent.trim()]) return;
  role.classList.add("context-term", "role-context-term");
  role.tabIndex = 0;
  role.setAttribute("role", "button");
  role.setAttribute("aria-describedby", "skill-tooltip");
  role.setAttribute("aria-label", `${role.textContent.trim()}: show interest and expertise`);
  role.addEventListener("mouseenter", () => showRoleTooltip(role));
  role.addEventListener("mouseleave", hideSkillTooltip);
  role.addEventListener("focus", () => showRoleTooltip(role));
  role.addEventListener("blur", hideSkillTooltip);
  role.addEventListener("click", (event) => {
    event.stopPropagation();
    showRoleTooltip(role);
  });
});

document.addEventListener("click", hideSkillTooltip);
window.addEventListener("scroll", () => {
  if (activeSkill) positionSkillTooltip(activeSkill);
}, { passive: true });
window.addEventListener("resize", hideSkillTooltip);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideSkillTooltip();
});

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
  const details = document.createElement("div");
  details.className = "experience-collapsible-details";
  details.id = `experience-details-${index + 1}`;
  details.hidden = true;
  details.append(card.querySelector(".experience-role"), card.querySelector(".experience-impact"));
  const button = document.createElement("button");
  button.className = "experience-toggle";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", details.id);
  button.textContent = "View impact";
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.textContent = expanded ? "View impact" : "Hide impact";
    details.hidden = expanded;
  });
  card.append(details, button);
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
window.addEventListener("resize", () => {
  if (window.innerWidth <= 980) heroCard.style.transform = "";
}, { passive: true });

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

const initialHashTarget = location.hash ? document.querySelector(location.hash) : null;
if (initialHashTarget) {
  initialHashTarget.classList.add("hash-target-ready");
  initialHashTarget.classList.add("visible");
  initialHashTarget.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}
reveals.forEach((element) => {
  if (!element.classList.contains("visible")) observer.observe(element);
});

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
  ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">AI</span>
      <div><strong>Preparing an answer...</strong></div>
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

  // Show warm-up notice if the Render backend takes more than 5 seconds to respond
  const warmupTimer = window.setTimeout(() => {
    if (status.textContent === "Starting…") {
      ragOutput.innerHTML = `
    <div class="answer-header">
      <span class="answer-icon">AI</span>
      <div><strong>The AI is warming up.</strong><small>The backend takes ~30 seconds to start — ask your question now and it will be answered once ready.</small></div>
    </div>
    <p class="answer-body">Feel free to explore projects and experience in the meantime, or wait a moment and try a question.</p>
  `;
    }
  }, 5000);

  try {
    const response = await fetch(apiUrl("/api/health"));
    clearTimeout(warmupTimer);
    if (!response.ok) throw new Error("API unavailable");
    const health = await response.json();
    status.textContent = "Live";
    stats.textContent = `${health.documents} sources / ${health.chunks} evidence chunks`;
    // If the warm-up notice is showing, swap it back to the ready greeting
    if (ragOutput.querySelector(".answer-body")?.textContent.includes("explore projects")) {
      ragOutput.innerHTML = `<div class="answer-header"><span class="answer-icon">AI</span><div><strong>Hi, I'm Karan AI.</strong><small>The assistant is ready — ask about Karan's work, projects, skills, or resume.</small></div></div>`;
    }
  } catch {
    clearTimeout(warmupTimer);
    status.textContent = "Demo";
    if (ragOutput.querySelector(".answer-body")?.textContent.includes("explore projects")) {
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
