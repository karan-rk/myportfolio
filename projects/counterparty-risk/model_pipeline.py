import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
FEATURES = [
    "payment_delay_days",
    "utilization_ratio",
    "revenue_change",
    "dispute_rate",
    "relationship_years",
    "prior_watchlist_events",
    "industry_stress",
    "liquidity_ratio",
]


def sigmoid(value):
    return 1 / (1 + np.exp(-value))


def generate_data(rows=20000, seed=42):
    rng = np.random.default_rng(seed)
    month = rng.integers(1, 25, rows)
    payment_delay = np.maximum(0, rng.gamma(2.2, 5.0, rows) + month * 0.22)
    utilization = np.clip(rng.beta(3, 2, rows), 0, 1)
    revenue_change = np.clip(rng.normal(-0.01 - month * 0.0015, 0.16, rows), -0.7, 0.5)
    dispute_rate = np.clip(rng.beta(1.4, 10, rows), 0, 1)
    relationship_years = np.clip(rng.gamma(2.5, 2.1, rows), 0, 20)
    prior_events = rng.poisson(0.28 + utilization * 0.35, rows)
    industry_stress = np.clip(rng.beta(2, 4, rows) + month * 0.004, 0, 1)
    liquidity = np.clip(rng.lognormal(0.05, 0.45, rows), 0.2, 4)

    treatment_probability = sigmoid(
        -2.2 + payment_delay * 0.035 + utilization * 1.1 + prior_events * 0.5 + industry_stress * 0.7
    )
    intervention = rng.binomial(1, treatment_probability)
    baseline_logit = (
        -4.2
        + payment_delay * 0.055
        + utilization * 2.0
        - revenue_change * 2.0
        + dispute_rate * 2.2
        + prior_events * 0.7
        + industry_stress * 1.4
        - liquidity * 0.55
        - relationship_years * 0.035
    )
    outcome_probability = sigmoid(baseline_logit - intervention * 0.7)
    watchlist_90d = rng.binomial(1, outcome_probability)
    exposure = rng.lognormal(14.2, 0.8, rows)

    frame = pd.DataFrame(
        {
            "counterparty_id": [f"CP-{index:05d}" for index in range(rows)],
            "month": month,
            "segment": rng.choice(["Enterprise", "Mid-market", "SMB"], rows, p=[0.25, 0.4, 0.35]),
            "region": rng.choice(["North America", "Europe", "Asia Pacific", "Latin America"], rows),
            "payment_delay_days": payment_delay.round(1),
            "utilization_ratio": utilization.round(3),
            "revenue_change": revenue_change.round(3),
            "dispute_rate": dispute_rate.round(3),
            "relationship_years": relationship_years.round(1),
            "prior_watchlist_events": prior_events,
            "industry_stress": industry_stress.round(3),
            "liquidity_ratio": liquidity.round(3),
            "intervention": intervention,
            "watchlist_90d": watchlist_90d,
            "exposure": exposure.round(0),
            "treatment_probability": treatment_probability,
        }
    )
    return frame


def estimate_intervention_effect(frame):
    confounders = FEATURES
    propensity = LogisticRegression(max_iter=500)
    propensity.fit(frame[confounders], frame["intervention"])
    probability = np.clip(propensity.predict_proba(frame[confounders])[:, 1], 0.05, 0.95)
    treated = frame["intervention"].to_numpy()
    outcome = frame["watchlist_90d"].to_numpy()
    treated_mean = np.sum(treated * outcome / probability) / np.sum(treated / probability)
    control_mean = np.sum((1 - treated) * outcome / (1 - probability)) / np.sum((1 - treated) / (1 - probability))
    return float(treated_mean - control_mean)


def model_candidates(seed=42):
    return {
        "Logistic Regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=1000, class_weight="balanced", random_state=seed),
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=220,
            min_samples_leaf=18,
            class_weight="balanced",
            random_state=seed,
            n_jobs=-1,
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=180,
            learning_rate=0.06,
            max_leaf_nodes=15,
            min_samples_leaf=25,
            l2_regularization=0.4,
            random_state=seed,
        ),
    }


def evaluate_predictions(y_true, scores):
    roc_auc = roc_auc_score(y_true, scores)
    average_precision = average_precision_score(y_true, scores)
    threshold = float(np.quantile(scores, 0.9))
    flagged = scores >= threshold
    return {
        "roc_auc": round(float(roc_auc), 3),
        "gini": round(float(2 * roc_auc - 1), 3),
        "average_precision": round(float(average_precision), 3),
        "recall_at_10": round(float(y_true[flagged].sum() / max(y_true.sum(), 1)), 3),
        "precision_at_10": round(float(y_true[flagged].mean()), 3),
        "risk_threshold": round(threshold, 3),
    }


def benchmark_models(train, test, seed=42):
    results = []
    trained = {}
    for name, candidate in model_candidates(seed).items():
        started = time.perf_counter()
        candidate.fit(train[FEATURES], train["watchlist_90d"])
        training_ms = (time.perf_counter() - started) * 1000
        started = time.perf_counter()
        scores = candidate.predict_proba(test[FEATURES])[:, 1]
        inference_ms = (time.perf_counter() - started) * 1000
        metrics = evaluate_predictions(test["watchlist_90d"].to_numpy(), scores)
        results.append(
            {
                "model": name,
                **metrics,
                "training_ms": round(training_ms, 1),
                "inference_ms": round(inference_ms, 1),
                "inference_us_per_record": round(inference_ms * 1000 / len(test), 2),
            }
        )
        trained[name] = (candidate, scores)
    results.sort(key=lambda result: (result["average_precision"], result["roc_auc"]), reverse=True)
    return results, trained


def calibration_metrics(y_true, scores, bins=10):
    edges = np.linspace(0, 1, bins + 1)
    assignments = np.clip(np.digitize(scores, edges) - 1, 0, bins - 1)
    rows = []
    expected_calibration_error = 0.0
    for index in range(bins):
        mask = assignments == index
        if not mask.any():
            continue
        predicted = float(scores[mask].mean())
        observed = float(y_true[mask].mean())
        count = int(mask.sum())
        expected_calibration_error += abs(predicted - observed) * count / len(y_true)
        rows.append(
            {
                "bin": index + 1,
                "count": count,
                "predicted": round(predicted, 3),
                "observed": round(observed, 3),
            }
        )
    return {
        "brier": round(float(brier_score_loss(y_true, scores)), 4),
        "ece": round(float(expected_calibration_error), 4),
        "curve": rows,
    }


def calibrate_champion(frame, champion_name, final_model, test, seed=42):
    fit = frame[frame["month"] <= 15]
    calibration = frame[(frame["month"] >= 16) & (frame["month"] <= 18)]
    calibration_model = model_candidates(seed)[champion_name]
    calibration_model.fit(fit[FEATURES], fit["watchlist_90d"])
    calibration_scores = calibration_model.predict_proba(calibration[FEATURES])[:, 1]
    calibrator = LogisticRegression(max_iter=500)
    calibrator.fit(calibration_scores.reshape(-1, 1), calibration["watchlist_90d"])

    raw_test_scores = final_model.predict_proba(test[FEATURES])[:, 1]
    calibrated_scores = calibrator.predict_proba(raw_test_scores.reshape(-1, 1))[:, 1]
    y_test = test["watchlist_90d"].to_numpy()
    raw_metrics = calibration_metrics(y_test, raw_test_scores)
    calibrated_metrics = calibration_metrics(y_test, calibrated_scores)
    return calibrated_scores, {
        "method": "Platt scaling",
        "fit_months": "1-15",
        "calibration_months": "16-18",
        "test_months": "19-24",
        "raw": raw_metrics,
        "calibrated": calibrated_metrics,
        "brier_improvement": round(raw_metrics["brier"] - calibrated_metrics["brier"], 4),
        "ece_improvement": round(raw_metrics["ece"] - calibrated_metrics["ece"], 4),
    }


def explain_logistic_predictions(model, frame):
    scaler = model.named_steps["standardscaler"]
    classifier = model.named_steps["logisticregression"]
    standardized = scaler.transform(frame[FEATURES])
    contributions = standardized * classifier.coef_[0]
    explanations = {}
    for row_index, (counterparty_id, values) in enumerate(zip(frame["counterparty_id"], contributions)):
        drivers = sorted(
            [
                {
                    "feature": feature,
                    "value": round(float(frame.iloc[row_index][feature]), 3),
                    "contribution": round(float(contribution), 4),
                    "direction": "increases risk" if contribution >= 0 else "reduces risk",
                }
                for feature, contribution in zip(FEATURES, values)
            ],
            key=lambda item: abs(item["contribution"]),
            reverse=True,
        )
        explanations[counterparty_id] = {
            "baseline_log_odds": round(float(classifier.intercept_[0]), 4),
            "raw_log_odds": round(float(classifier.intercept_[0] + values.sum()), 4),
            "drivers": drivers,
        }
    return explanations


def train_and_export(rows=20000, seed=42):
    DATA_DIR.mkdir(exist_ok=True)
    frame = generate_data(rows, seed)
    train = frame[frame["month"] <= 18]
    test = frame[frame["month"] > 18].copy()

    benchmarks, trained_models = benchmark_models(train, test, seed)
    champion = benchmarks[0]
    model, champion_scores = trained_models[champion["model"]]
    calibrated_scores, calibration = calibrate_champion(frame, champion["model"], model, test, seed)
    test["raw_risk_score"] = champion_scores
    test["risk_score"] = calibrated_scores
    calibrated_ranking = evaluate_predictions(test["watchlist_90d"].to_numpy(), calibrated_scores)

    importance = permutation_importance(
        model, test[FEATURES], test["watchlist_90d"], n_repeats=4, random_state=seed, scoring="roc_auc"
    )
    importance_rows = sorted(
        [{"feature": feature, "importance": round(float(value), 4)} for feature, value in zip(FEATURES, importance.importances_mean)],
        key=lambda item: item["importance"],
        reverse=True,
    )
    intervention_effect = estimate_intervention_effect(frame)

    medium_threshold = float(test["risk_score"].quantile(0.7))
    high_threshold = float(test["risk_score"].quantile(0.9))
    test["risk_band"] = np.select(
        [test["risk_score"] >= high_threshold, test["risk_score"] >= medium_threshold],
        ["High", "Medium"],
        default="Low",
    )
    sample = pd.concat(
        [
            test[test["risk_band"] == "High"].nlargest(60, "risk_score"),
            test[test["risk_band"] == "Medium"].sample(40, random_state=seed),
            test[test["risk_band"] == "Low"].sample(20, random_state=seed),
        ]
    ).sort_values("risk_score", ascending=False)
    sample["top_signal"] = sample[FEATURES].apply(
        lambda row: max(
            {
                "Payment delay": row["payment_delay_days"] / 35,
                "Utilization": row["utilization_ratio"],
                "Revenue decline": max(-row["revenue_change"], 0) / 0.4,
                "Industry stress": row["industry_stress"],
                "Prior events": row["prior_watchlist_events"] / 3,
            },
            key=lambda signal: {
                "Payment delay": row["payment_delay_days"] / 35,
                "Utilization": row["utilization_ratio"],
                "Revenue decline": max(-row["revenue_change"], 0) / 0.4,
                "Industry stress": row["industry_stress"],
                "Prior events": row["prior_watchlist_events"] / 3,
            }[signal],
        ),
        axis=1,
    )
    explanations = explain_logistic_predictions(model, sample) if champion["model"] == "Logistic Regression" else {}

    metrics = {
        "data_type": "synthetic",
        "records": rows,
        "train_records": len(train),
        "test_records": len(test),
        "champion_model": champion["model"],
        "benchmarks": benchmarks,
        "calibration": calibration,
        "roc_auc": champion["roc_auc"],
        "gini": champion["gini"],
        "average_precision": champion["average_precision"],
        "recall_at_10": champion["recall_at_10"],
        "precision_at_10": champion["precision_at_10"],
        "risk_threshold": calibrated_ranking["risk_threshold"],
        "risk_band_thresholds": {"medium": round(medium_threshold, 3), "high": round(high_threshold, 3)},
        "intervention_effect": round(intervention_effect, 3),
        "feature_importance": importance_rows,
        "monthly_risk_rate": [
            {"month": int(month), "rate": round(float(group["watchlist_90d"].mean()), 3)}
            for month, group in frame.groupby("month")
        ],
    }
    (DATA_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (DATA_DIR / "explanations.json").write_text(json.dumps(explanations, indent=2), encoding="utf-8")
    sample[
        [
            "counterparty_id", "segment", "region", "risk_score", "risk_band", "top_signal",
            "payment_delay_days", "utilization_ratio", "revenue_change", "industry_stress", "exposure"
        ]
    ].to_csv(DATA_DIR / "counterparties.csv", index=False)
    return metrics


if __name__ == "__main__":
    print(json.dumps(train_and_export(), indent=2))
