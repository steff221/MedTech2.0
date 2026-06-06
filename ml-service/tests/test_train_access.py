"""End-to-end: synthetic access windows -> train Isolation Forest -> model scoring.

Skipped automatically when scikit-learn isn't installed.
"""
import numpy as np
import pandas as pd
import pytest

pytest.importorskip("sklearn")

from app.schemas import AccessAnomalyFeatures, RiskBand  # noqa: E402
from app.scoring import access  # noqa: E402
from training.access_features import FEATURE_COLUMNS, RULE_FLAG_COLUMN  # noqa: E402
from training.train_access import train  # noqa: E402


def _synthetic(n: int = 600, seed: int = 0) -> pd.DataFrame:
    """Mostly-normal windows + a few injected outliers (bulk/off-hours/multi-IP)."""
    rng = np.random.default_rng(seed)
    normal = pd.DataFrame({
        "total_actions": rng.integers(1, 15, n),
        "distinct_patients_viewed": rng.integers(0, 5, n),
        "off_hours_actions": rng.integers(0, 2, n),
        "distinct_ips": np.ones(n, dtype=int),
        "failed_actions": rng.integers(0, 2, n),
        "distinct_entity_types": rng.integers(1, 4, n),
    })
    outliers = pd.DataFrame({
        "total_actions": rng.integers(60, 120, 20),
        "distinct_patients_viewed": rng.integers(25, 60, 20),
        "off_hours_actions": rng.integers(40, 90, 20),
        "distinct_ips": rng.integers(3, 6, 20),
        "failed_actions": rng.integers(5, 20, 20),
        "distinct_entity_types": rng.integers(3, 6, 20),
    })
    df = pd.concat([normal, outliers], ignore_index=True)
    # Coarse rule flag mirroring access_features (bulk OR off-hours).
    df[RULE_FLAG_COLUMN] = ((df["distinct_patients_viewed"] > 10) | (df["off_hours_actions"] > 0)).astype(int)
    return df[FEATURE_COLUMNS + [RULE_FLAG_COLUMN]]


def test_train_saves_artifact_and_flags_outlier(tmp_path):
    data = tmp_path / "access.csv"
    out = tmp_path / "access_model.joblib"
    _synthetic().to_csv(data, index=False)

    # force=True: this test exercises the train->save->score mechanics, not the guardrail.
    train(data, out, force=True)
    assert out.exists()

    artifact = access._load_model(out)
    assert artifact is not None

    # A clearly anomalous vector should score higher than a clearly normal one.
    anomalous = AccessAnomalyFeatures(
        total_actions=100, distinct_patients_viewed=50, off_hours_actions=80,
        distinct_ips=5, failed_actions=15, distinct_entity_types=5,
    )
    normal = AccessAnomalyFeatures(
        total_actions=6, distinct_patients_viewed=2, off_hours_actions=0,
        distinct_ips=1, failed_actions=0, distinct_entity_types=2,
    )
    a_score, a_band, a_factors = access.score_model(artifact, anomalous)
    n_score, _, _ = access.score_model(artifact, normal)

    assert a_score > n_score
    assert a_band in set(RiskBand)
    assert a_factors  # explanatory factors present for the anomalous case


def test_load_missing_returns_none(tmp_path):
    assert access._load_model(tmp_path / "nope.joblib") is None


def test_guardrail_refuses_to_save_too_few_windows(tmp_path):
    # 60 windows is below MIN_WINDOWS -> must refuse and write nothing.
    data = tmp_path / "small.csv"
    out = tmp_path / "small_model.joblib"
    _synthetic(n=60).to_csv(data, index=False)

    with pytest.raises(SystemExit):
        train(data, out)  # no force
    assert not out.exists()
