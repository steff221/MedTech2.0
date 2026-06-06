"""Train the access-anomaly Isolation Forest and save a runtime artifact.

Isolation Forest is unsupervised: it learns "normal" access behaviour from the
unlabelled audit history and isolates outliers. We still evaluate *offline* against the
existing rules — using ``rule_anomaly`` (bulk/off-hours at the per-window grain) as a
pseudo-label — to confirm the model recovers the rule signal (high ROC-AUC) while also
being able to surface outliers the fixed rules miss.

The saved artifact bundles everything ``app.scoring.access`` needs to produce a stable
0..1 anomaly percentile and explanations: the fitted model, feature order, training
score distribution, per-feature mean/std, band cutoffs, and a version string.

Usage:
    python -m training.train_access                      # reads data/access_dataset.csv
    python -m training.train_access --data ... --out ...
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from .access_features import FEATURE_COLUMNS, RULE_FLAG_COLUMN

DEFAULT_DATA = Path("data/access_dataset.csv")
DEFAULT_OUT = Path("app/scoring/artifacts/access_model.joblib")

# Guardrails: Isolation Forest needs a decent amount of mostly-normal history, and we
# want it to at least track the existing rules before it goes live. Override with --force.
MIN_WINDOWS = 300
MIN_ROC_AUC_VS_RULES = 0.70

# Band cutoffs on the 0..1 anomaly percentile. Kept identical to app.scoring.access.
MEDIUM_CUTOFF = 0.55
HIGH_CUTOFF = 0.75


def _guardrail_reasons(n: int, auc: float | None) -> list[str]:
    """Reasons this model should NOT be promoted to the active scorer (empty == OK)."""
    reasons = []
    if n < MIN_WINDOWS:
        reasons.append(f"only {n} windows (need >= {MIN_WINDOWS} of mostly-normal history)")
    if auc is not None and auc < MIN_ROC_AUC_VS_RULES:
        reasons.append(f"ROC-AUC vs rules {auc:.3f} below {MIN_ROC_AUC_VS_RULES:.2f} "
                       "(model barely tracks the known rule signal)")
    return reasons


def train(data_path: Path, out_path: Path, force: bool = False) -> dict:
    from sklearn.ensemble import IsolationForest
    from sklearn.metrics import roc_auc_score
    import joblib

    df = pd.read_csv(data_path)
    if len(df) < 20:
        raise SystemExit(f"Only {len(df)} windows — too few to train Isolation Forest.")

    X = df[FEATURE_COLUMNS].astype(float)
    # Fit on the raw array (no column names) so it matches the numpy input the serving
    # path uses in app.scoring.access.score_model — avoids sklearn's feature-name warning.
    X_arr = X.to_numpy()

    model = IsolationForest(
        n_estimators=200, contamination="auto", random_state=42, n_jobs=-1,
    )
    model.fit(X_arr)

    # Training score distribution -> the basis for the inference anomaly percentile.
    train_scores = model.score_samples(X_arr)
    # Anomaly percentile per row, identical to app.scoring.access.score_model.
    anomaly = np.array([(train_scores >= s).mean() for s in train_scores])

    version = f"access-iforest-{date.today():%Y%m%d}"
    metrics: dict = {
        "n_windows": int(len(df)),
        "flagged_high": int((anomaly >= HIGH_CUTOFF).sum()),
        "rule_flagged": int(df[RULE_FLAG_COLUMN].sum()) if RULE_FLAG_COLUMN in df else None,
    }

    # Offline alignment with the rule baseline (only meaningful if both classes present).
    auc = None
    if RULE_FLAG_COLUMN in df and df[RULE_FLAG_COLUMN].nunique() == 2:
        auc = float(roc_auc_score(df[RULE_FLAG_COLUMN], anomaly))
        metrics["roc_auc_vs_rules"] = auc

    print("=== Access-anomaly model ===")
    print(f"version        : {version}")
    print(f"windows        : {len(df)}")
    print(f"flagged HIGH   : {metrics['flagged_high']}  (rule baseline flagged {metrics['rule_flagged']})")
    if auc is not None:
        print(f"ROC-AUC vs rules: {auc:.3f}  (alignment with the existing rule signal)")
    else:
        print("ROC-AUC vs rules: n/a (need both flagged and unflagged windows)")

    # Guardrail: don't let a weak model silently become the active scorer.
    reasons = _guardrail_reasons(len(df), auc)
    if reasons:
        bullet = "\n  - ".join(reasons)
        if not force:
            raise SystemExit(
                "Refusing to save — this model is not trustworthy yet:\n  - " + bullet
                + "\nThe service keeps using the transparent heuristic. Re-run with --force to "
                  "override (not recommended for production)."
            )
        print("WARNING: saving despite guardrail failures (--force):\n  - " + bullet)

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "train_scores": train_scores,
        "feature_means": X.mean().to_dict(),
        "feature_stds": X.std(ddof=0).replace(0.0, 1.0).to_dict(),
        "medium_cutoff": MEDIUM_CUTOFF,
        "high_cutoff": HIGH_CUTOFF,
        "model_version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, out_path)
    print(f"\nSaved artifact -> {out_path}")
    return metrics


def main() -> None:
    ap = argparse.ArgumentParser(description="Train the access-anomaly Isolation Forest.")
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Training CSV from extract_access.py.")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Where to write the joblib artifact.")
    ap.add_argument("--force", action="store_true",
                    help="Save even if guardrails fail (too few windows / weak AUC). Not for production.")
    args = ap.parse_args()
    train(args.data, args.out, force=args.force)


if __name__ == "__main__":
    main()
