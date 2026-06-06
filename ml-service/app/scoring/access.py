"""Access-anomaly scorer.

Turns a user's recent access-behaviour vector into an anomaly score (0..1, higher =
more anomalous) plus the features that drove it. Two backends behind one ``score()``:

* **Isolation Forest** (Phase 4) — loaded from a joblib artifact produced by
  ``training/train_access.py`` if present (``ACCESS_MODEL_PATH`` or the default
  ``app/scoring/artifacts/access_model.joblib``). Isolation Forest is unsupervised, so
  it learns "normal" from unlabelled audit history and flags outliers.
* **Heuristic** (default) — a transparent weighted blend of the same signals the
  rule-based ``AnomalyDetectionJob`` already cares about, normalised to 0..1. Used when
  no artifact exists or its ML deps aren't installed.

Spring calls this best-effort and only alerts on a HIGH band, so a quiet fallback is
fine — the existing fixed rules keep running regardless.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from ..schemas import AccessAnomalyFeatures, RiskBand

log = logging.getLogger(__name__)

HEURISTIC_VERSION = "access-heuristic-v0"

# Band cutoffs on the 0..1 anomaly score. The trained artifact carries its own copies.
_MEDIUM_CUTOFF = 0.55
_HIGH_CUTOFF = 0.75

# Soft reference points for the heuristic, aligned with AnomalyDetectionJob thresholds
# (BULK_THRESHOLD=10). Saturating divisors keep each signal in 0..1.
_BULK_REF = 10.0
_VOLUME_REF = 60.0  # ~1 action/min over the hour window is already busy

# Must match training.access_features.FEATURE_COLUMNS. Duplicated so this serving
# module has no import-time dependency on the training package / pandas.
_FEATURE_ORDER = [
    "total_actions",
    "distinct_patients_viewed",
    "off_hours_actions",
    "distinct_ips",
    "failed_actions",
    "distinct_entity_types",
]

_DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "access_model.joblib"


def _band(score: float, medium: float = _MEDIUM_CUTOFF, high: float = _HIGH_CUTOFF) -> RiskBand:
    if score >= high:
        return RiskBand.HIGH
    if score >= medium:
        return RiskBand.MEDIUM
    return RiskBand.LOW


# --------------------------------------------------------------------------------------
# Heuristic backend
# --------------------------------------------------------------------------------------
def score_heuristic(f: AccessAnomalyFeatures) -> tuple[float, RiskBand, list[str]]:
    """Transparent weighted blend. Return (anomaly 0..1, band, top_factors-desc)."""
    total = max(f.total_actions, 1)
    contributions: dict[str, float] = {
        # Many distinct patient records is the classic bulk-exfiltration signal.
        "distinct_patients_viewed": 0.35 * min(f.distinct_patients_viewed / _BULK_REF, 1.0),
        # A high fraction of activity at night is suspicious.
        "off_hours_actions": 0.25 * min(f.off_hours_actions / total, 1.0),
        # Acting from several IPs in one window can mean shared/stolen creds.
        "distinct_ips": 0.15 * min(max(f.distinct_ips - 1, 0) / 2.0, 1.0),
        # Failures relative to volume hint at probing.
        "failed_actions": 0.15 * min(f.failed_actions / total, 1.0),
        # Sheer volume.
        "total_actions": 0.10 * min(f.total_actions / _VOLUME_REF, 1.0),
    }
    score = round(min(sum(contributions.values()), 1.0), 4)
    top_factors = [
        name for name, value in sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
        if value > 0.0
    ]
    return score, _band(score), top_factors


# --------------------------------------------------------------------------------------
# Isolation Forest backend
# --------------------------------------------------------------------------------------
def _load_model(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        import joblib

        artifact = joblib.load(path)
        log.info("Loaded access-anomaly model %s from %s", artifact.get("model_version"), path)
        return artifact
    except Exception as ex:
        log.warning("Could not load access model from %s (%s); using heuristic.", path, ex)
        return None


def _model_top_factors(artifact: dict, values: list[float]) -> list[str]:
    """Rank features by how far this vector deviates above the training mean (z-score).

    Isolation Forest gives no per-feature attribution, so we approximate: the features
    that are most unusually *high* for this user are the most likely drivers. Cheap and
    explainable enough for an alert hint.
    """
    means = artifact.get("feature_means", {})
    stds = artifact.get("feature_stds", {})
    z = {}
    for col, v in zip(_FEATURE_ORDER, values):
        sd = stds.get(col, 0.0) or 1.0
        z[col] = (v - means.get(col, 0.0)) / sd
    ranked = sorted(_FEATURE_ORDER, key=lambda c: z[c], reverse=True)
    return [c for c in ranked if z[c] > 0.5][:3]


def score_model(artifact: dict, f: AccessAnomalyFeatures) -> tuple[float, RiskBand, list[str]]:
    import numpy as np

    values = [float(getattr(f, c)) for c in _FEATURE_ORDER]
    raw = float(artifact["model"].score_samples(np.array([values]))[0])

    # score_samples: higher = more normal. Convert to an anomaly percentile against the
    # training distribution so the output is a stable, monotonic 0..1.
    train_scores = artifact["train_scores"]
    frac_more_normal = float((train_scores >= raw).mean())  # how many train pts are >= as normal
    anomaly = round(min(max(frac_more_normal, 0.0), 1.0), 4)

    band = _band(anomaly, artifact.get("medium_cutoff", _MEDIUM_CUTOFF),
                 artifact.get("high_cutoff", _HIGH_CUTOFF))
    return anomaly, band, _model_top_factors(artifact, values)


# --------------------------------------------------------------------------------------
# Active backend (resolved once at import)
# --------------------------------------------------------------------------------------
_MODEL = _load_model(Path(os.getenv("ACCESS_MODEL_PATH", str(_DEFAULT_MODEL_PATH))))
MODEL_VERSION = _MODEL["model_version"] if _MODEL else HEURISTIC_VERSION


def score(f: AccessAnomalyFeatures) -> tuple[float, RiskBand, list[str]]:
    """Score access anomaly using the trained model if loaded, else the heuristic."""
    if _MODEL is not None:
        return score_model(_MODEL, f)
    return score_heuristic(f)
