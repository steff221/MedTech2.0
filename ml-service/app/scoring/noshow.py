"""No-show scorer.

Phase 0 ships a transparent HEURISTIC so the Spring <-> ML contract is testable
end-to-end before any real data exists. In Phase 3 this module loads a trained
model (e.g. GradientBoosting on NO_SHOW vs COMPLETED) and `score()` keeps the same
signature — so swapping the model is a one-file change, no contract churn.

The heuristic is a weighted blend of the few signals that dominate no-show
behaviour in practice; weights are deliberately simple and documented.
"""
from __future__ import annotations

from ..schemas import NoShowFeatures, RiskBand

MODEL_VERSION = "noshow-heuristic-v0"

# Above this many past appointments we trust the patient's own history rate;
# below it we lean on generic priors so a single past no-show doesn't dominate.
_HISTORY_TRUST_MIN = 3

# Band cutoffs on the final 0..1 risk.
_MEDIUM_CUTOFF = 0.35
_HIGH_CUTOFF = 0.60


def _band(risk: float) -> RiskBand:
    if risk >= _HIGH_CUTOFF:
        return RiskBand.HIGH
    if risk >= _MEDIUM_CUTOFF:
        return RiskBand.MEDIUM
    return RiskBand.LOW


def score(f: NoShowFeatures) -> tuple[float, RiskBand, list[str]]:
    """Return (risk 0..1, band, top_factors-desc)."""
    contributions: dict[str, float] = {}

    # 1) Personal history — strongest signal, but only when we have enough of it.
    if f.prior_appointment_count >= _HISTORY_TRUST_MIN:
        contributions["historical_no_show_rate"] = 0.55 * f.historical_no_show_rate
    else:
        # Cold-start prior: assume a modest baseline no-show probability.
        contributions["historical_no_show_rate"] = 0.55 * 0.15

    # 2) Lead time — the longer the wait, the more likely the patient forgets.
    #    Saturates around ~30 days.
    lead_factor = min(f.lead_time_days, 30) / 30.0
    contributions["lead_time_days"] = 0.20 * lead_factor

    # 3) Prior rescheduling signals flakiness; saturates at 3+.
    reschedule_factor = min(f.prior_reschedule_count, 3) / 3.0
    contributions["prior_reschedule_count"] = 0.15 * reschedule_factor

    # 4) Off-peak slots (very early / late) miss more often.
    if f.hour_of_day < 9 or f.hour_of_day >= 17:
        contributions["hour_of_day"] = 0.06
    else:
        contributions["hour_of_day"] = 0.0

    # 5) Monday slots have a small bump (weekend forgetfulness).
    contributions["day_of_week"] = 0.04 if f.day_of_week == 1 else 0.0

    risk = round(min(sum(contributions.values()), 1.0), 4)

    # top_factors: the inputs that actually pushed the score up, most first.
    top_factors = [
        name for name, value in sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
        if value > 0.0
    ]

    return risk, _band(risk), top_factors
