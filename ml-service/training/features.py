"""Point-in-time feature engineering for the no-show model.

This is the single source of truth for how raw appointment rows become the feature
vector the model trains on. It mirrors the seven fields in
``app.schemas.NoShowFeatures`` (which Spring builds at booking time) so the model is
trained on exactly what it will be scored on.

Critical difference from the live path: features here are computed **as-of the moment
each appointment was booked**, using only the patient's *earlier* appointments. This
prevents target leakage — at training time we must not let an appointment "see" its
own outcome or any later history that wouldn't have existed when it was booked.

The function is pure (DataFrame in, DataFrame out) so it can be unit-tested without a
database.
"""
from __future__ import annotations

import pandas as pd

# Outcomes that resolve to a no-show label. Everything else (SCHEDULED, CANCELLED,
# RESCHEDULED) is not a clean attended/missed signal and is dropped from training.
_POSITIVE = "NO_SHOW"
_NEGATIVE = "COMPLETED"

# The feature columns the model consumes, in a stable order. Keep in sync with
# app.schemas.NoShowFeatures and the Spring NoShowScoreRequest.Features record.
FEATURE_COLUMNS = [
    "historical_no_show_rate",
    "lead_time_days",
    "day_of_week",
    "hour_of_day",
    "appointment_type",
    "prior_reschedule_count",
    "prior_appointment_count",
]
LABEL_COLUMN = "no_show"
CATEGORICAL_COLUMNS = ["appointment_type"]
NUMERIC_COLUMNS = [c for c in FEATURE_COLUMNS if c not in CATEGORICAL_COLUMNS]


def build_dataset(appointments: pd.DataFrame) -> pd.DataFrame:
    """Turn raw appointment rows into a labelled, leakage-free feature table.

    Expected input columns:
        patient_id, appointment_date (date/datetime), appointment_time (str "HH:MM"),
        appointment_type (str or NA), status (str), created_at (datetime).

    Returns a DataFrame with ``FEATURE_COLUMNS`` + ``LABEL_COLUMN``, one row per
    COMPLETED or NO_SHOW appointment that had a determinable booking time.
    """
    if appointments.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS + [LABEL_COLUMN])

    df = appointments.copy()
    df["appointment_date"] = pd.to_datetime(df["appointment_date"])
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True).dt.tz_localize(None)

    # Order each patient's appointments by when they occur. Cumulative counts that are
    # *shifted by one* then describe only the strictly-earlier appointments — i.e. what
    # was known when the current one was booked.
    df = df.sort_values(["patient_id", "appointment_date", "appointment_time"])
    grp = df.groupby("patient_id", sort=False)

    prior_total = grp.cumcount()  # 0-based rank == number of earlier appointments
    is_no_show = (df["status"] == _POSITIVE).astype(int)
    is_reschedule = (df["status"] == "RESCHEDULED").astype(int)
    prior_no_shows = grp["status"].apply(  # type: ignore[call-overload]
        lambda s: (s == _POSITIVE).cumsum().shift(fill_value=0)
    ).reset_index(level=0, drop=True)
    prior_reschedules = grp["status"].apply(
        lambda s: (s == "RESCHEDULED").cumsum().shift(fill_value=0)
    ).reset_index(level=0, drop=True)

    df["prior_appointment_count"] = prior_total.astype(int)
    df["prior_reschedule_count"] = prior_reschedules.astype(int)
    df["historical_no_show_rate"] = (
        prior_no_shows / df["prior_appointment_count"].where(df["prior_appointment_count"] > 0)
    ).fillna(0.0).clip(0.0, 1.0)

    df["lead_time_days"] = (
        (df["appointment_date"].dt.normalize() - df["created_at"].dt.normalize())
        .dt.days.clip(lower=0).fillna(0).astype(int)
    )
    df["day_of_week"] = df["appointment_date"].dt.dayofweek + 1  # ISO: 1=Mon..7=Sun
    df["hour_of_day"] = (
        df["appointment_time"].astype(str).str.split(":").str[0]
        .astype(float).fillna(0).astype(int).clip(0, 23)
    )
    df["appointment_type"] = df["appointment_type"].fillna("UNKNOWN").astype(str)

    # Keep only resolved attended/missed outcomes and attach the label.
    resolved = df[df["status"].isin([_POSITIVE, _NEGATIVE])].copy()
    resolved[LABEL_COLUMN] = (resolved["status"] == _POSITIVE).astype(int)

    return resolved[FEATURE_COLUMNS + [LABEL_COLUMN]].reset_index(drop=True)
