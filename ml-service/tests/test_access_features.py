"""Access feature engineering — per-user-window bucketing and rule pseudo-label."""
import pandas as pd

from training.access_features import FEATURE_COLUMNS, RULE_FLAG_COLUMN, build_dataset


def _rows():
    # User 1: a single busy daytime window (10:00-ish Skopje) viewing 3 patients from 1 IP.
    base = "2026-03-02T08:00:00Z"  # 08:00Z == 09:00 Skopje (winter)
    rows = [
        {"user_id": 1, "action_type": "VIEW", "entity_type": "Patient", "entity_id": pid,
         "status": "SUCCESS", "ip_address": "10.0.0.1", "created_at": base}
        for pid in (101, 102, 103)
    ]
    # Plus one failed login in the same window from a second IP.
    rows.append({"user_id": 1, "action_type": "LOGIN", "entity_type": "User", "entity_id": 1,
                 "status": "FAILURE", "ip_address": "10.0.0.2", "created_at": base})
    return pd.DataFrame(rows)


def test_basic_window_aggregation():
    ds = build_dataset(_rows())
    assert list(ds.columns) == FEATURE_COLUMNS + [RULE_FLAG_COLUMN]
    assert len(ds) == 1
    row = ds.iloc[0]
    assert row["total_actions"] == 4
    assert row["distinct_patients_viewed"] == 3
    assert row["distinct_ips"] == 2
    assert row["failed_actions"] == 1
    assert row["distinct_entity_types"] == 2  # Patient, User
    assert row["off_hours_actions"] == 0      # 09:00 local is daytime
    assert row["rule_anomaly"] == 0


def test_off_hours_and_bulk_trip_rule_flag():
    # 23:00 Skopje == 22:00Z (winter); 12 distinct patients -> bulk + off-hours.
    rows = [
        {"user_id": 2, "action_type": "VIEW", "entity_type": "Patient", "entity_id": pid,
         "status": "SUCCESS", "ip_address": "10.0.0.9", "created_at": "2026-03-02T22:00:00Z"}
        for pid in range(200, 212)  # 12 patients
    ]
    ds = build_dataset(pd.DataFrame(rows))
    row = ds.iloc[0]
    assert row["distinct_patients_viewed"] == 12
    assert row["off_hours_actions"] == 12
    assert row["rule_anomaly"] == 1


def test_rows_without_user_are_ignored():
    df = _rows()
    df.loc[len(df)] = {"user_id": None, "action_type": "VIEW", "entity_type": "Patient",
                       "entity_id": 999, "status": "SUCCESS", "ip_address": "10.0.0.3",
                       "created_at": "2026-03-02T08:00:00Z"}
    ds = build_dataset(df)
    assert ds["total_actions"].sum() == 4  # the null-user row excluded


def test_empty_input_returns_empty_frame():
    ds = build_dataset(pd.DataFrame(columns=["user_id", "action_type", "entity_type",
                                             "entity_id", "status", "ip_address", "created_at"]))
    assert ds.empty
    assert list(ds.columns) == FEATURE_COLUMNS + [RULE_FLAG_COLUMN]
