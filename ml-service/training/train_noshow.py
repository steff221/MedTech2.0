"""Train the no-show GradientBoosting model and save a runtime artifact.

Pipeline: one-hot encode ``appointment_type``, pass the six numeric features through,
fit a GradientBoostingClassifier. We report ROC-AUC / PR-AUC on a held-out split and
compare against the Phase-0 heuristic so we only promote a model that actually beats
the rules.

The saved artifact is a single joblib file that ``app.scoring.noshow`` loads at startup.
It bundles everything inference needs — the fitted pipeline, the feature order, grouped
importances (for explanations), the band cutoffs, and a version string — so swapping the
model never touches the serving code or the API contract.

Usage:
    python -m training.train_noshow                      # reads data/noshow_dataset.csv
    python -m training.train_noshow --data data/foo.csv --out app/scoring/artifacts/noshow_model.joblib
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from .features import (
    CATEGORICAL_COLUMNS,
    FEATURE_COLUMNS,
    LABEL_COLUMN,
    NUMERIC_COLUMNS,
)

DEFAULT_DATA = Path("data/noshow_dataset.csv")
DEFAULT_OUT = Path("app/scoring/artifacts/noshow_model.joblib")

# Guardrails: refuse to save a model that isn't trustworthy, so a weak model can't
# silently become the active scorer. Override with --force for experiments.
MIN_ROWS = 200
MIN_POSITIVES = 30

# Band cutoffs on the predicted probability — kept identical to the heuristic so the
# UI's LOW/MEDIUM/HIGH semantics don't shift when the model swaps in.
MEDIUM_CUTOFF = 0.35
HIGH_CUTOFF = 0.60


def _build_pipeline():
    from sklearn.compose import ColumnTransformer
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder

    pre = ColumnTransformer(
        transformers=[
            ("type", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLUMNS),
            ("num", "passthrough", NUMERIC_COLUMNS),
        ]
    )
    clf = GradientBoostingClassifier(random_state=42)
    return Pipeline([("pre", pre), ("clf", clf)])


def _grouped_importances(pipeline) -> dict[str, float]:
    """Map the fitted model's per-column importances back onto the seven original
    feature names (summing the one-hot columns of appointment_type)."""
    pre = pipeline.named_steps["pre"]
    importances = pipeline.named_steps["clf"].feature_importances_
    names = pre.get_feature_names_out()

    grouped: dict[str, float] = {c: 0.0 for c in FEATURE_COLUMNS}
    for raw_name, imp in zip(names, importances):
        # raw_name looks like "type_appointment_type_FOLLOW_UP" or "num_lead_time_days"
        if raw_name.startswith("type_"):
            grouped["appointment_type"] += float(imp)
        else:
            col = raw_name.split("__", 1)[-1].replace("num_", "", 1)
            # ColumnTransformer uses "<transformer>__<col>"; normalise to bare column.
            col = col.split("__")[-1]
            if col in grouped:
                grouped[col] += float(imp)
    total = sum(grouped.values()) or 1.0
    return {k: v / total for k, v in grouped.items()}


def _heuristic_auc(df: pd.DataFrame) -> float | None:
    """Baseline ROC-AUC from the Phase-0 heuristic, for an apples-to-apples comparison."""
    from sklearn.metrics import roc_auc_score

    # Import here to avoid a circular import at module load.
    from app.schemas import NoShowFeatures
    from app.scoring.noshow import score_heuristic

    risks = []
    for _, r in df.iterrows():
        f = NoShowFeatures(
            historical_no_show_rate=float(r["historical_no_show_rate"]),
            lead_time_days=int(r["lead_time_days"]),
            day_of_week=int(r["day_of_week"]),
            hour_of_day=int(r["hour_of_day"]),
            appointment_type=str(r["appointment_type"]),
            prior_reschedule_count=int(r["prior_reschedule_count"]),
            prior_appointment_count=int(r["prior_appointment_count"]),
        )
        risks.append(score_heuristic(f)[0])
    if df[LABEL_COLUMN].nunique() < 2:
        return None
    return float(roc_auc_score(df[LABEL_COLUMN], risks))


def _guardrail_reasons(n: int, positives: int, model_auc: float, baseline_auc: float | None) -> list[str]:
    """Reasons this model should NOT be promoted to the active scorer (empty == OK)."""
    reasons = []
    if n < MIN_ROWS:
        reasons.append(f"only {n} rows (need >= {MIN_ROWS} for a reliable split)")
    if positives < MIN_POSITIVES:
        reasons.append(f"only {positives} NO_SHOW examples (need >= {MIN_POSITIVES})")
    if baseline_auc is not None and model_auc <= baseline_auc:
        reasons.append(f"ROC-AUC {model_auc:.3f} does not beat the heuristic ({baseline_auc:.3f})")
    return reasons


def train(data_path: Path, out_path: Path, force: bool = False) -> dict:
    from sklearn.metrics import average_precision_score, classification_report, roc_auc_score
    from sklearn.model_selection import train_test_split
    import joblib

    df = pd.read_csv(data_path)
    if df[LABEL_COLUMN].nunique() < 2:
        raise SystemExit("Dataset has only one class — cannot train a classifier.")

    X, y = df[FEATURE_COLUMNS], df[LABEL_COLUMN]
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    pipeline = _build_pipeline()
    pipeline.fit(X_tr, y_tr)

    proba = pipeline.predict_proba(X_te)[:, 1]
    model_auc = float(roc_auc_score(y_te, proba))
    model_ap = float(average_precision_score(y_te, proba))
    baseline_auc = _heuristic_auc(df.loc[X_te.index])

    version = f"noshow-gb-{date.today():%Y%m%d}"
    metrics = {
        "roc_auc": model_auc,
        "pr_auc": model_ap,
        "baseline_heuristic_roc_auc": baseline_auc,
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
        "base_rate": float(y.mean()),
    }

    print("=== No-show model ===")
    print(f"version       : {version}")
    print(f"train / test  : {len(X_tr)} / {len(X_te)}  (base rate {y.mean():.1%})")
    print(f"model ROC-AUC : {model_auc:.3f}   PR-AUC: {model_ap:.3f}")
    if baseline_auc is not None:
        verdict = "BEATS" if model_auc > baseline_auc else "does NOT beat"
        print(f"heuristic AUC : {baseline_auc:.3f}   -> model {verdict} the heuristic")
    print(classification_report(y_te, (proba >= 0.5).astype(int), zero_division=0))

    # Guardrail: don't let a weak model silently become the active scorer.
    reasons = _guardrail_reasons(len(df), int(y.sum()), model_auc, baseline_auc)
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
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "importances": _grouped_importances(pipeline),
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
    ap = argparse.ArgumentParser(description="Train the no-show GradientBoosting model.")
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Training CSV from extract.py.")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Where to write the joblib artifact.")
    ap.add_argument("--force", action="store_true",
                    help="Save even if guardrails fail (small data / no improvement). Not for production.")
    args = ap.parse_args()
    train(args.data, args.out, force=args.force)


if __name__ == "__main__":
    main()
