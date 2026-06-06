"""End-to-end training smoke test: synthetic data -> train -> artifact -> model scoring.

Skipped automatically if scikit-learn isn't installed (e.g. the slim heuristic-only
environment), so the heuristic test suite still runs everywhere.
"""
import numpy as np
import pandas as pd
import pytest

pytest.importorskip("sklearn")

from app.schemas import NoShowFeatures, RiskBand  # noqa: E402
from app.scoring import noshow  # noqa: E402
from training.features import FEATURE_COLUMNS, LABEL_COLUMN  # noqa: E402
from training.train_noshow import train  # noqa: E402


def _synthetic_dataset(n: int = 1200, seed: int = 0) -> pd.DataFrame:
    """A learnable dataset: no-show probability rises with history rate and lead time."""
    rng = np.random.default_rng(seed)
    hist = rng.uniform(0, 1, n)
    lead = rng.integers(0, 40, n)
    resch = rng.integers(0, 4, n)
    prior = rng.integers(0, 30, n)
    dow = rng.integers(1, 8, n)
    hour = rng.integers(7, 20, n)
    types = rng.choice(["CONSULTATION", "FOLLOW_UP", "PROCEDURE", "CHECKUP"], n)

    logit = -1.0 + 2.5 * hist + 0.05 * lead + 0.3 * resch
    prob = 1 / (1 + np.exp(-logit))
    label = (rng.uniform(0, 1, n) < prob).astype(int)

    return pd.DataFrame({
        "historical_no_show_rate": hist,
        "lead_time_days": lead,
        "day_of_week": dow,
        "hour_of_day": hour,
        "appointment_type": types,
        "prior_reschedule_count": resch,
        "prior_appointment_count": prior,
        LABEL_COLUMN: label,
    })[FEATURE_COLUMNS + [LABEL_COLUMN]]


def test_train_saves_artifact_that_scores(tmp_path):
    data = tmp_path / "ds.csv"
    out = tmp_path / "model.joblib"
    _synthetic_dataset().to_csv(data, index=False)

    metrics = train(data, out)

    assert out.exists()
    # On a genuinely learnable signal the model should be clearly better than chance.
    assert metrics["roc_auc"] > 0.65

    # Load the artifact and score through the model path; output respects the contract.
    artifact = noshow._load_model(out)
    assert artifact is not None
    risk, band, factors = noshow.score_model(artifact, NoShowFeatures(
        historical_no_show_rate=0.9, lead_time_days=35, day_of_week=1, hour_of_day=8,
        appointment_type="FOLLOW_UP", prior_reschedule_count=3, prior_appointment_count=20,
    ))
    assert 0.0 <= risk <= 1.0
    assert band in set(RiskBand)
    assert factors  # at least one explanatory factor


def test_load_model_missing_file_returns_none(tmp_path):
    assert noshow._load_model(tmp_path / "nope.joblib") is None
