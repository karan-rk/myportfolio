import unittest

import numpy as np

from model_pipeline import (
    FEATURES,
    benchmark_models,
    calibration_metrics,
    estimate_intervention_effect,
    explain_logistic_predictions,
    generate_data,
    model_candidates,
)


class PipelineTests(unittest.TestCase):
    def test_generated_data_has_expected_shape(self):
        frame = generate_data(1000, seed=7)
        self.assertEqual(len(frame), 1000)
        self.assertTrue(set(FEATURES).issubset(frame.columns))

    def test_outcome_is_binary(self):
        frame = generate_data(1000, seed=8)
        self.assertTrue(set(frame["watchlist_90d"].unique()).issubset({0, 1}))

    def test_intervention_estimate_is_protective(self):
        frame = generate_data(10000, seed=9)
        self.assertLess(estimate_intervention_effect(frame), 0)

    def test_benchmark_compares_three_models(self):
        frame = generate_data(2500, seed=10)
        train = frame[frame["month"] <= 18]
        test = frame[frame["month"] > 18]
        results, trained = benchmark_models(train, test, seed=10)
        self.assertEqual(len(results), 3)
        self.assertEqual(len(trained), 3)
        self.assertTrue(all(0 <= result["roc_auc"] <= 1 for result in results))
        self.assertGreaterEqual(results[0]["average_precision"], results[-1]["average_precision"])

    def test_calibration_metrics_report_brier_and_curve(self):
        outcome = np.array([0, 0, 1, 1])
        scores = np.array([0.1, 0.2, 0.8, 0.9])
        metrics = calibration_metrics(outcome, scores, bins=4)
        self.assertLess(metrics["brier"], 0.1)
        self.assertGreater(len(metrics["curve"]), 0)

    def test_logistic_explanations_are_additive(self):
        frame = generate_data(500, seed=7)
        model = model_candidates(seed=7)["Logistic Regression"]
        model.fit(frame[FEATURES], frame["watchlist_90d"])
        explanations = explain_logistic_predictions(model, frame.head(5))
        for explanation in explanations.values():
            reconstructed = explanation["baseline_log_odds"] + sum(
                driver["contribution"] for driver in explanation["drivers"]
            )
            self.assertAlmostEqual(reconstructed, explanation["raw_log_odds"], places=3)


if __name__ == "__main__":
    unittest.main()
