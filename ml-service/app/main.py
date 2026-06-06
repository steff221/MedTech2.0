"""MedTech Anomaly Intelligence — scoring API.

A stateless scoring service. Spring (AnomalyDetectionJob / AppointmentService) stays
the decision-maker; this service just turns feature vectors into scores + explanations.
Designed to be called best-effort: if it's down, Spring falls back to its existing rules.
"""
from fastapi import FastAPI

from .schemas import (
    AccessAnomalyRequest,
    AccessAnomalyResponse,
    HealthResponse,
    NoShowRequest,
    NoShowResponse,
)
from .scoring import access, noshow

app = FastAPI(
    title="MedTech Anomaly Intelligence",
    version="0.1.0",
    description="Stateless ML scoring for no-show risk and access anomalies.",
)


@app.get("/health", response_model=HealthResponse, tags=["ops"])
def health() -> HealthResponse:
    """Liveness + which models are active. Spring uses this for its circuit breaker."""
    return HealthResponse(
        status="ok",
        model_version=noshow.MODEL_VERSION,
        access_model_version=access.MODEL_VERSION,
    )


@app.post("/score/no-show", response_model=NoShowResponse, tags=["scoring"])
def score_no_show(req: NoShowRequest) -> NoShowResponse:
    """Score a single appointment's no-show risk from features Spring already has."""
    risk, band, top_factors = noshow.score(req.features)
    return NoShowResponse(
        risk=risk,
        band=band,
        top_factors=top_factors,
        model_version=noshow.MODEL_VERSION,
    )


@app.post("/score/access-anomaly", response_model=AccessAnomalyResponse, tags=["scoring"])
def score_access_anomaly(req: AccessAnomalyRequest) -> AccessAnomalyResponse:
    """Score a user's recent access behaviour for anomalousness."""
    anomaly, band, top_factors = access.score(req.features)
    return AccessAnomalyResponse(
        user_id=req.user_id,
        score=anomaly,
        band=band,
        top_factors=top_factors,
        model_version=access.MODEL_VERSION,
    )
