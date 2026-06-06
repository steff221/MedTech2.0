"""No-show scorer.

Two backends behind one ``score()`` entry point:

* **Trained model** (Phase 3) — if a joblib artifact produced by
  ``training/train_noshow.py`` is present (path from ``NOSHOW_MODEL_PATH`` or the default
  ``app/scoring/artifacts/noshow_model.joblib``), it is loaded at import and used.
* **Heuristic** (Phase 0) — a transparent weighted blend, used when no artifact exists
  or its ML deps aren't installed. This keeps the service useful before any model is
  trained and is the graceful fallback if model loading ever fails.

Either way the function signature and the API contract are identical, so swapping the
model is invisible to Spring. ``MODEL_VERSION`` reflects whichever backend is active and
is what ``/health`` reports.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from ..schemas import NoShowFeatures, RiskBand

log = logging.getLogger(__name__)

HEURISTIC_VERSION = "noshow-heuristic-v0"

# Above this many past appointments we trust the patient's own history rate;
# below it we lean on generic priors so a single past no-show doesn't dominate.
_HISTORY_TRUST_MIN = 3

# Band cutoffs on the final 0..1 risk. The trained artifact carries its own copies
# (kept identical) so bands stay stable across the heuristic/model swap.
_MEDIUM_CUTOFF = 0.35
_HIGH_CUTOFF = 0.60

# Must match training.features.FEATURE_COLUMNS. Duplicated here deliberately so this
# serving module has no import-time dependency on the training package / pandas.
_FEATURE_ORDER = [
    "historical_no_show_rate",
    "lead_time_days",
    "day_of_week",
    "hour_of_day",
    "appointment_type",
    "prior_reschedule_count",
    "prior_appointment_count",
]

_DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "noshow_model.joblib"


def _band(risk: float, medium: float = _MEDIUM_CUTOFF, high: float = _HIGH_CUTOFF) -> RiskBand:
    if risk >= high:
        return RiskBand.HIGH
    if risk >= medium:
        return RiskBand.MEDIUM
    return RiskBand.LOW


# --------------------------------------------------------------------------------------
# Heuristic backend (Phase 0)
# --------------------------------------------------------------------------------------
def score_heuristic(f: NoShowFeatures) -> tuple[float, RiskBand, list[str]]:
    """Transparent weighted-blend scorer. Return (risk 0..1, band, top_factors-desc)."""
    contributions: dict[str, float] = {}

    # 1) Personal history — strongest signal, but only when we have enough of it.
    if f.prior_appointment_count >= _HISTORY_TRUST_MIN:
        contributions["historical_no_show_rate"] = 0.55 * f.historical_no_show_rate
    else:
        contributions["historical_no_show_rate"] = 0.55 * 0.15  # cold-start prior

    # 2) Lead time — the longer the wait, the more likely the patient forgets (~30d sat).
    contributions["lead_time_days"] = 0.20 * (min(f.lead_time_days, 30) / 30.0)

    # 3) Prior rescheduling signals flakiness; saturates at 3+.
    contributions["prior_reschedule_count"] = 0.15 * (min(f.prior_reschedule_count, 3) / 3.0)

    # 4) Off-peak slots (very early / late) miss more often.
    contributions["hour_of_day"] = 0.06 if (f.hour_of_day < 9 or f.hour_of_day >= 17) else 0.0

    # 5) Monday slots have a small bump (weekend forgetfulness).
    contributions["day_of_week"] = 0.04 if f.day_of_week == 1 else 0.0

    risk = round(min(sum(contributions.values()), 1.0), 4)
    top_factors = [
        name for name, value in sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
        if value > 0.0
    ]
    return risk, _band(risk), top_factors


# --------------------------------------------------------------------------------------
# Trained-model backend (Phase 3)
# --------------------------------------------------------------------------------------
def _load_model(path: Path) -> dict | None:
    """Load the joblib artifact if present and its deps are installed; else None."""
    if not path.exists():
        return None
    try:
        import joblib

        artifact = joblib.load(path)
        log.info("Loaded no-show model %s from %s", artifact.get("model_version"), path)
        return artifact
    except Exception as ex:  # missing sklearn/joblib, corrupt file, version skew, ...
        log.warning("Could not load no-show model from %s (%s); using heuristic.", path, ex)
        return None


def _model_top_factors(artifact: dict, f: NoShowFeatures) -> list[str]:
    """Explanation: rank features by (global importance x how 'elevated' this instance is).

    A purely global ranking would return the same factors for everyone; weighting by a
    simple per-feature activation makes the explanation instance-specific and cheap (no
    SHAP dependency), which is enough for a UI hint.
    """
    activation = {
        "historical_no_show_rate": f.historical_no_show_rate,
        "lead_time_days": min(f.lead_time_days, 30) / 30.0,
        "prior_reschedule_count": min(f.prior_reschedule_count, 3) / 3.0,
        "prior_appointment_count": 0.3,  # context, not directional — small flat weight
        "hour_of_day": 1.0 if (f.hour_of_day < 9 or f.hour_of_day >= 17) else 0.0,
        "day_of_week": 1.0 if f.day_of_week == 1 else 0.0,
        "appointment_type": 0.5,  # categorical — let importance dominate
    }
    importances: dict[str, float] = artifact.get("importances", {})
    ranked = sorted(
        _FEATURE_ORDER,
        key=lambda c: importances.get(c, 0.0) * activation.get(c, 0.0),
        reverse=True,
    )
    return [c for c in ranked if importances.get(c, 0.0) * activation.get(c, 0.0) > 0.0][:3]


def score_model(artifact: dict, f: NoShowFeatures) -> tuple[float, RiskBand, list[str]]:
    import pandas as pd

    row = pd.DataFrame([{c: getattr(f, c) for c in _FEATURE_ORDER}])
    risk = float(artifact["pipeline"].predict_proba(row)[0, 1])
    risk = round(min(max(risk, 0.0), 1.0), 4)
    band = _band(risk, artifact.get("medium_cutoff", _MEDIUM_CUTOFF),
                 artifact.get("high_cutoff", _HIGH_CUTOFF))
    return risk, band, _model_top_factors(artifact, f)


# --------------------------------------------------------------------------------------
# Active backend selection (resolved once at import)
# --------------------------------------------------------------------------------------
_MODEL = _load_model(Path(os.getenv("NOSHOW_MODEL_PATH", str(_DEFAULT_MODEL_PATH))))
MODEL_VERSION = _MODEL["model_version"] if _MODEL else HEURISTIC_VERSION


def score(f: NoShowFeatures) -> tuple[float, RiskBand, list[str]]:
    """Score no-show risk using the trained model if loaded, else the heuristic."""
    if _MODEL is not None:
        return score_model(_MODEL, f)
    return score_heuristic(f)
