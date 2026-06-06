"""Export an access-behaviour dataset from the MedTech Postgres audit logs.

Reads raw audit rows, buckets them into per-user-window feature vectors via
``access_features.build_dataset``, and writes a CSV for ``train_access.py``.

Connection settings come from the same PG* env vars as ``extract.py``:
    PGHOST (127.0.0.1) PGPORT (5433) PGDATABASE (medtech) PGUSER (medtech_app) PGPASSWORD

Usage:
    PGPASSWORD=... python -m training.extract_access            # -> data/access_dataset.csv
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

import pandas as pd

from .access_features import FEATURE_COLUMNS, RULE_FLAG_COLUMN, build_dataset

_QUERY = """
    SELECT user_id,
           action_type::text AS action_type,
           entity_type,
           entity_id,
           status::text      AS status,
           ip_address,
           created_at
      FROM audit_logs
     WHERE user_id IS NOT NULL
"""

DEFAULT_OUT = Path("data/access_dataset.csv")


def _connect():
    import psycopg

    return psycopg.connect(
        host=os.getenv("PGHOST", "127.0.0.1"),
        port=int(os.getenv("PGPORT", "5433")),
        dbname=os.getenv("PGDATABASE", "medtech"),
        user=os.getenv("PGUSER", "medtech_app"),
        password=os.environ["PGPASSWORD"],
    )


def fetch_raw() -> pd.DataFrame:
    with _connect() as conn:
        return pd.read_sql(_QUERY, conn)


def main() -> None:
    ap = argparse.ArgumentParser(description="Export the access-anomaly training dataset.")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output CSV path.")
    ap.add_argument("--freq", default="1h", help="Window size (pandas offset alias, e.g. 1h).")
    args = ap.parse_args()

    raw = fetch_raw()
    dataset = build_dataset(raw, freq=args.freq)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(args.out, index=False)

    n = len(dataset)
    flagged = int(dataset[RULE_FLAG_COLUMN].sum()) if n else 0
    print(
        f"Wrote {n} user-window vectors to {args.out} "
        f"({flagged} flagged by the rule baseline). Features: {FEATURE_COLUMNS}"
    )
    if n < 100:
        print("WARNING: very few windows — Isolation Forest needs a fair amount of normal history.")


if __name__ == "__main__":
    main()
