/* ─── skills.js ──────────────────────────────────────────────────
   Skill knowledge data and interactive tooltip system.
   To add/edit a skill: update skillKnowledge or contextSkillUsage.
   To change tooltip appearance: edit .skill-tooltip in styles.css
   ─────────────────────────────────────────────────────────────── */

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
