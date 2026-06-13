const formatPercent = value => `${(value * 100).toFixed(1)}%`;
const formatMoney = value => new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(value);
const title = value => value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

let counterparties = [];
let explanations = {};

async function loadData() {
  const [metrics, csv, explanationData] = await Promise.all([
    fetch("data/metrics.json").then(response => response.json()),
    fetch("data/counterparties.csv").then(response => response.text()),
    fetch("data/explanations.json").then(response => response.json())
  ]);
  counterparties = parseCsv(csv);
  explanations = explanationData;
  renderMetrics(metrics);
  renderBenchmarks(metrics);
  renderCalibration(metrics.calibration);
  renderTrend(metrics.monthly_risk_rate);
  renderImportance(metrics.feature_importance);
  document.getElementById("effect-value").textContent = `${(metrics.intervention_effect * 100).toFixed(1)} pp`;
  renderTable();
  if (counterparties.length) renderDecision(counterparties[0].counterparty_id);
}

function renderCalibration(calibration) {
  document.getElementById("calibration-method").textContent = `${calibration.method} / months ${calibration.calibration_months}`;
  const items = [
    ["Raw Brier", calibration.raw.brier.toFixed(4)],
    ["Calibrated Brier", calibration.calibrated.brier.toFixed(4)],
    ["Raw ECE", calibration.raw.ece.toFixed(4)],
    ["Calibrated ECE", calibration.calibrated.ece.toFixed(4)]
  ];
  document.getElementById("calibration-metrics").innerHTML = items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  const points = [
    ...calibration.raw.curve.map(point => ({ ...point, type: "raw" })),
    ...calibration.calibrated.curve.map(point => ({ ...point, type: "calibrated" }))
  ];
  document.getElementById("calibration-chart").innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-label="Reliability diagram"><line class="ideal-line" x1="0" y1="100" x2="100" y2="0"></line>${points.map(point => `<circle class="${point.type}-point" cx="${point.predicted * 100}" cy="${100 - point.observed * 100}" r="2.2"><title>${point.type}: predicted ${formatPercent(point.predicted)}, observed ${formatPercent(point.observed)}</title></circle>`).join("")}</svg>`;
}

function renderBenchmarks(metrics) {
  document.getElementById("champion-label").textContent = `${metrics.champion_model} champion`;
  document.getElementById("benchmark-table").innerHTML = metrics.benchmarks.map(row => `<div class="benchmark-row ${row.model === metrics.champion_model ? "champion" : ""}"><strong>${row.model}</strong><span>ROC ${row.roc_auc.toFixed(3)}</span><span>PR ${row.average_precision.toFixed(3)}</span><span>Recall ${formatPercent(row.recall_at_10)}</span><span>${row.inference_us_per_record.toFixed(2)} μs/row</span>${row.model === metrics.champion_model ? "<b>Champion</b>" : "<b>Candidate</b>"}</div>`).join("");
}

function parseCsv(csv) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const keys = header.split(",");
  return rows.map(row => Object.fromEntries(row.split(",").map((value, index) => [keys[index], value])));
}

function renderMetrics(metrics) {
  const cards = [
    ["ROC-AUC", metrics.roc_auc.toFixed(3), "Temporal holdout"],
    ["Gini", metrics.gini.toFixed(3), "Discrimination"],
    ["Top 10% recall", formatPercent(metrics.recall_at_10), "Captured watchlist events"],
    ["Top 10% precision", formatPercent(metrics.precision_at_10), "Action queue quality"],
    ["Records", metrics.records.toLocaleString(), "Synthetic longitudinal data"]
  ];
  document.getElementById("metric-grid").innerHTML = cards.map(([label, value, note]) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
}

function renderTrend(points) {
  const max = Math.max(...points.map(point => point.rate));
  document.getElementById("trend-chart").innerHTML = points.map(point => `<div class="trend-bar ${point.month > 18 ? "holdout" : ""}" style="height:${Math.max(8, point.rate / max * 100)}%" data-label="Month ${point.month}: ${formatPercent(point.rate)}"></div>`).join("");
}

function renderImportance(rows) {
  const max = rows[0].importance;
  document.getElementById("importance-list").innerHTML = rows.slice(0, 7).map(row => `<div class="importance-item"><div><span>${title(row.feature)}</span><strong>${row.importance.toFixed(3)}</strong></div><div class="importance-track"><i style="width:${Math.max(2, row.importance / max * 100)}%"></i></div></div>`).join("");
}

function renderTable() {
  const band = document.getElementById("band-filter").value;
  const segment = document.getElementById("segment-filter").value;
  const search = document.getElementById("search-filter").value.toLowerCase();
  const filtered = counterparties.filter(row =>
    (band === "all" || row.risk_band === band) &&
    (segment === "all" || row.segment === segment) &&
    row.counterparty_id.toLowerCase().includes(search)
  ).slice(0, 35);
  document.getElementById("queue-count").textContent = `${filtered.length} records`;
  document.getElementById("risk-table").innerHTML = filtered.map(row => `<tr><td><strong>${row.counterparty_id}</strong><br><small>${row.segment} / ${row.region}</small></td><td><span class="risk-pill ${row.risk_band}">${formatPercent(Number(row.risk_score))}</span></td><td>${row.top_signal}</td><td>${row.payment_delay_days}d</td><td>${formatPercent(Number(row.utilization_ratio))}</td><td>${formatMoney(Number(row.exposure))}</td><td><button class="explain-button" data-counterparty="${row.counterparty_id}">Explain</button></td></tr>`).join("");
}

["band-filter", "segment-filter", "search-filter"].forEach(id => document.getElementById(id).addEventListener("input", renderTable));
document.getElementById("risk-table").addEventListener("click", event => {
  const button = event.target.closest(".explain-button");
  if (button) renderDecision(button.dataset.counterparty);
});

function renderDecision(counterpartyId) {
  const row = counterparties.find(item => item.counterparty_id === counterpartyId);
  const explanation = explanations[counterpartyId];
  if (!row || !explanation) return;
  document.getElementById("decision-title").textContent = counterpartyId;
  document.getElementById("decision-score").textContent = `${formatPercent(Number(row.risk_score))} calibrated risk`;
  const topDrivers = explanation.drivers.slice(0, 6);
  const increasing = topDrivers.filter(driver => driver.contribution >= 0).length;
  document.getElementById("decision-summary").textContent = `${increasing} of the strongest 6 factors increase risk. Raw log-odds: ${explanation.raw_log_odds.toFixed(2)}.`;
  const max = Math.max(...topDrivers.map(driver => Math.abs(driver.contribution)), 0.01);
  document.getElementById("decision-drivers").innerHTML = topDrivers.map(driver => `<div class="decision-driver ${driver.contribution >= 0 ? "up" : "down"}"><div><span>${title(driver.feature)} <small>(${driver.value})</small></span><strong>${driver.contribution >= 0 ? "+" : ""}${driver.contribution.toFixed(3)}</strong></div><div class="driver-track"><i style="width:${Math.abs(driver.contribution) / max * 100}%"></i></div><small>${driver.direction}</small></div>`).join("");
}

loadData().catch(() => {
  ["metric-grid", "benchmark-table", "calibration-chart",
   "trend-chart", "risk-table", "importance-list"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="error">Data unavailable — run model_pipeline.py to regenerate.</p>`;
  });
});
