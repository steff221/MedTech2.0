"""Access-behaviour feature engineering for the anomaly model.

Buckets raw audit-log rows into per-user, per-window feature vectors (default 1-hour
windows, matching the AnomalyDetectionJob scan cadence) and computes the six aggregates
in ``app.schemas.AccessAnomalyFeatures``. This is the single source of truth for the
access feature contract; ``app.scoring.access`` mirrors the column order.

Pure (DataFrame in, DataFrame out) so it's unit-testable without a database.
"""
from __future__ import annotations

import pandas as pd

# The feature columns the model consumes, in a stable order. Keep in sync with
# app.schemas.AccessAnomalyFeatures and app.scoring.access._FEATURE_ORDER.
FEATURE_COLUMNS = [
    "total_actions",
    "distinct_patients_viewed",
    "off_hours_actions",
    "distinct_ips",
    "failed_actions",
    "distinct_entity_types",
]

# Not a model input — a coarse reproduction of the existing rule logic at the
# per-user-window grain, used only for offline evaluation (rules as pseudo-labels).
RULE_FLAG_COLUMN = "rule_anomaly"

_LOCAL_TZ = "Europe/Skopje"
_BULK_THRESHOLD = 10  # mirrors AnomalyDetectionJob.BULK_THRESHOLD


def build_dataset(audit: pd.DataFrame, freq: str = "1h") -> pd.DataFrame:
    """Aggregate audit rows into per-(user, window) behaviour vectors.

    Expected input columns:
        user_id, action_type, entity_type, entity_id, status, ip_address, created_at.

    Returns ``FEATURE_COLUMNS`` + ``RULE_FLAG_COLUMN`` (one row per active user-window).
    """
    cols = FEATURE_COLUMNS + [RULE_FLAG_COLUMN]
    if audit.empty:
        return pd.DataFrame(columns=cols)

    df = audit.copy()
    df = df[df["user_id"].notna()]
    if df.empty:
        return pd.DataFrame(columns=cols)

    ts = pd.to_datetime(df["created_at"], utc=True).dt.tz_convert(_LOCAL_TZ)
    df["window"] = ts.dt.floor(freq)
    local_hour = ts.dt.hour

    df["_is_patient_view"] = (
        (df["action_type"] == "VIEW") & (df["entity_type"] == "Patient")
    )
    df["_is_off_hours"] = (local_hour < 6) | (local_hour >= 22)
    df["_is_failure"] = df["status"] == "FAILURE"

    grouped = df.groupby(["user_id", "window"], sort=False)
    feat = grouped.apply(_aggregate_window, include_groups=False).reset_index(drop=True)
    return feat[cols]


def _aggregate_window(g: pd.DataFrame) -> pd.Series:
    distinct_patients = g.loc[g["_is_patient_view"], "entity_id"].nunique()
    off_hours = int(g["_is_off_hours"].sum())
    row = {
        "total_actions": int(len(g)),
        "distinct_patients_viewed": int(distinct_patients),
        "off_hours_actions": off_hours,
        "distinct_ips": int(g["ip_address"].nunique()),
        "failed_actions": int(g["_is_failure"].sum()),
        "distinct_entity_types": int(g["entity_type"].nunique()),
    }
    # Rule baseline at this grain: bulk patient access OR any off-hours activity.
    row[RULE_FLAG_COLUMN] = int(distinct_patients > _BULK_THRESHOLD or off_hours > 0)
    return pd.Series(row)
