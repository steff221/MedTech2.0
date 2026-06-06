"""Request/response contracts for the scoring API.

These mirror the feature vectors Spring builds from entities it already has loaded
(see AppointmentService.book()), so the real-time path needs no DB access here.
Keep field names stable — they ARE the integration contract.
"""
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class RiskBand(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class NoShowFeatures(BaseModel):
    """All fields are derivable from data Spring already has at booking time."""

    historical_no_show_rate: float = Field(
        ..., ge=0.0, le=1.0,
        description="Fraction of this patient's past appointments that were NO_SHOW (0..1).",
    )
    lead_time_days: int = Field(
        ..., ge=0,
        description="Days between booking and the appointment date.",
    )
    day_of_week: int = Field(
        ..., ge=1, le=7,
        description="ISO day-of-week of the appointment (1=Mon .. 7=Sun).",
    )
    hour_of_day: int = Field(
        ..., ge=0, le=23,
        description="Hour of the appointment time (0..23).",
    )
    appointment_type: str = Field(
        ..., description="e.g. GENERAL_MEDICINE / SPECIALIST / DIAGNOSTICS.",
    )
    prior_reschedule_count: int = Field(
        0, ge=0,
        description="How many times this patient has rescheduled in the past.",
    )
    prior_appointment_count: int = Field(
        0, ge=0,
        description="Total past appointments — low counts mean the history rate is unreliable.",
    )


class NoShowRequest(BaseModel):
    features: NoShowFeatures
    model_version: str | None = Field(
        None, description="Optional pin; server falls back to its active model.",
    )


class NoShowResponse(BaseModel):
    risk: float = Field(..., ge=0.0, le=1.0, description="Probability of no-show (0..1).")
    band: RiskBand
    top_factors: List[str] = Field(
        ..., description="Feature names that pushed the score up, most influential first.",
    )
    model_version: str = Field(..., description="Which scorer produced this result.")


class HealthResponse(BaseModel):
    status: str = "ok"
    model_version: str
