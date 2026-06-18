"""Point-in-time feature engineering — the part most prone to silent target leakage."""
import pandas as pd

from training.features import FEATURE_COLUMNS, LABEL_COLUMN, build_dataset


def _raw():
    # One patient, three appointments in chronological order:
    #   #1 COMPLETED, #2 NO_SHOW, #3 COMPLETED
    return pd.DataFrame(
        [
            {"patient_id": 1, "appointment_date": "2026-01-10", "appointment_time": "09:30",
             "appointment_type": "CONSULTATION", "status": "COMPLETED", "created_at": "2026-01-05T08:00:00Z"},
            {"patient_id": 1, "appointment_date": "2026-02-10", "appointment_time": "18:00",
             "appointment_type": "FOLLOW_UP", "status": "NO_SHOW", "created_at": "2026-01-20T08:00:00Z"},
            {"patient_id": 1, "appointment_date": "2026-03-10", "appointment_time": "11:00",
             "appointment_type": "CHECKUP", "status": "COMPLETED", "created_at": "2026-03-09T08:00:00Z"},
        ]
    )


def test_schema_and_labels():
    ds = build_dataset(_raw())
    assert list(ds.columns) == FEATURE_COLUMNS + [LABEL_COLUMN]
    # Three resolved (COMPLETED/NO_SHOW) appointments -> three rows.
    assert len(ds) == 3
    assert ds[LABEL_COLUMN].tolist() == [0, 1, 0]


def test_history_is_point_in_time_no_leakage():
    ds = build_dataset(_raw())
    # First appointment: no prior history at all.
    assert ds.loc[0, "prior_appointment_count"] == 0
    assert ds.loc[0, "historical_no_show_rate"] == 0.0
    # Second: one prior (completed), so the rate is still 0 — must NOT see its own no-show.
    assert ds.loc[1, "prior_appointment_count"] == 1
    assert ds.loc[1, "historical_no_show_rate"] == 0.0
    # Third: two priors, one of which was the no-show -> 0.5.
    assert ds.loc[2, "prior_appointment_count"] == 2
    assert ds.loc[2, "historical_no_show_rate"] == 0.5


def test_derived_time_features():
    ds = build_dataset(_raw())
    # lead_time = appointment_date - created_at(date): 2026-01-10 - 2026-01-05 = 5 days.
    assert ds.loc[0, "lead_time_days"] == 5
    # 2026-01-10 is a Saturday -> ISO day 6; 09:30 -> hour 9.
    assert ds.loc[0, "day_of_week"] == 6
    assert ds.loc[0, "hour_of_day"] == 9
    assert ds.loc[1, "hour_of_day"] == 18


def test_unresolved_statuses_are_dropped():
    raw = _raw()
    raw.loc[len(raw)] = {
        "patient_id": 2, "appointment_date": "2026-04-01", "appointment_time": "10:00",
        "appointment_type": "CONSULTATION", "status": "CANCELLED", "created_at": "2026-03-25T08:00:00Z",
    }
    ds = build_dataset(raw)
    assert len(ds) == 3  # the CANCELLED row is excluded


def test_empty_input_returns_empty_frame():
    ds = build_dataset(pd.DataFrame(columns=["patient_id", "appointment_date", "appointment_time",
                                             "appointment_type", "status", "created_at"]))
    assert ds.empty
    assert list(ds.columns) == FEATURE_COLUMNS + [LABEL_COLUMN]
