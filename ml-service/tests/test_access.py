"""Access-anomaly heuristic + API contract (the backend's best-effort dependency)."""
from fastapi.testclient import TestClient

from app.main import app
from app.scoring import access, noshow

client = TestClient(app)


def _features(**overrides):
    base = {
        "total_actions": 12,
        "distinct_patients_viewed": 4,
        "off_hours_actions": 0,
        "distinct_ips": 1,
        "failed_actions": 0,
        "distinct_entity_types": 2,
    }
    base.update(overrides)
    return base


def test_health_reports_both_models():
    body = client.get("/health").json()
    assert body["model_version"] == noshow.MODEL_VERSION
    assert body["access_model_version"] == access.MODEL_VERSION


def test_normal_usage_is_low():
    r = client.post("/score/access-anomaly", json={"features": _features()})
    assert r.status_code == 200
    body = r.json()
    assert body["band"] == "LOW"
    assert 0.0 <= body["score"] <= 1.0


def test_bulk_off_hours_multi_ip_is_high():
    feats = _features(
        total_actions=80, distinct_patients_viewed=40, off_hours_actions=70,
        distinct_ips=4, failed_actions=10, distinct_entity_types=3,
    )
    body = client.post("/score/access-anomaly", json={"features": feats}).json()
    assert body["band"] == "HIGH"
    assert body["top_factors"][0] == "distinct_patients_viewed"


def test_user_id_is_echoed():
    body = client.post(
        "/score/access-anomaly", json={"user_id": 77, "features": _features()}
    ).json()
    assert body["user_id"] == 77


def test_rejects_negative_features():
    r = client.post("/score/access-anomaly", json={"features": _features(total_actions=-1)})
    assert r.status_code == 422
