from fastapi.testclient import TestClient

from app.main import app
from app.scoring import noshow

client = TestClient(app)


def _features(**overrides):
    base = {
        "historical_no_show_rate": 0.0,
        "lead_time_days": 0,
        "day_of_week": 3,
        "hour_of_day": 11,
        "appointment_type": "GENERAL_MEDICINE",
        "prior_reschedule_count": 0,
        "prior_appointment_count": 10,
    }
    base.update(overrides)
    return base


def test_health_reports_active_model():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["model_version"] == noshow.MODEL_VERSION


def test_reliable_patient_with_clean_history_is_low_risk():
    r = client.post("/score/no-show", json={"features": _features()})
    assert r.status_code == 200
    body = r.json()
    assert body["band"] == "LOW"
    assert 0.0 <= body["risk"] <= 1.0


def test_frequent_no_shower_with_long_lead_is_high_risk():
    feats = _features(
        historical_no_show_rate=0.8,
        lead_time_days=30,
        prior_reschedule_count=3,
        hour_of_day=8,
        prior_appointment_count=20,
    )
    r = client.post("/score/no-show", json={"features": feats})
    body = r.json()
    assert body["band"] == "HIGH"
    assert body["top_factors"][0] == "historical_no_show_rate"


def test_cold_start_patient_ignores_unreliable_history():
    # Only 1 prior appointment -> the 1.0 history rate must NOT dominate.
    feats = _features(historical_no_show_rate=1.0, prior_appointment_count=1)
    r = client.post("/score/no-show", json={"features": feats})
    assert r.json()["band"] != "HIGH"


def test_rejects_out_of_range_features():
    r = client.post("/score/no-show", json={"features": _features(day_of_week=9)})
    assert r.status_code == 422
