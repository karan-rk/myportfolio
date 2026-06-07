# Counterparty Risk Intelligence

A reproducible predictive-risk and intervention-analysis MVP built with synthetic counterparty data.

## Run model pipeline

```powershell
python model_pipeline.py
python -m unittest -v test_model_pipeline.py
```

The pipeline:

- Generates longitudinal synthetic counterparty records
- Uses months 1-18 for training and months 19-24 for temporal validation
- Benchmarks Logistic Regression, Random Forest, and HistGradientBoosting on the same temporal holdout
- Selects the champion by PR-AUC, then ROC-AUC
- Calibrates the champion with leakage-safe Platt scaling using months 16-18
- Reports Brier score, expected calibration error, and reliability-curve bins
- Reports ROC-AUC, Gini, average precision, recall at top 10%, and permutation importance
- Estimates an intervention effect using inverse propensity weighting
- Exports dashboard-ready metrics and prioritized counterparties
- Exports exact per-counterparty Logistic Regression contributions for local explanations

This project uses synthetic data and the intervention estimate is a causal-analysis demonstration, not a real-world causal claim.
