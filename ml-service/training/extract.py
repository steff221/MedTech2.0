"""Export a leakage-free no-show training set from the MedTech Postgres database.

Reads raw appointment rows, runs them through ``features.build_dataset`` (point-in-time
feature engineering), and writes a CSV under ``data/`` for ``train_noshow.py`` to consume.

Connection settings come from the environment so this works both on a developer laptop
(against the docker-compose Postgres on 127.0.0.1:5433) and inside CI:

    PGHOST     (default 127.0.0.1)
    PGPORT     (default 5433)
    PGDATABASE (default medtech)
    PGUSER     (default medtech_app)
    PGPASSWORD (required)

Usage:
    python -m training.extract                       # -> data/noshow_dataset.csv
    python -m training.extract --out data/foo.csv
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

import pandas as pd

from .features import LABEL_COLUMN, build_dataset

_QUERY = """
    SELECT patient_id,
           appointment_date,
           appointment_time,
           appointment_type::text AS appointment_type,
           status::text           AS status,
           created_at
      FROM appointments
"""

DEFAULT_OUT = Path("data/noshow_dataset.csv")


def _connect():
    """Open a psycopg connection from PG* env vars. Imported lazily so the rest of
    the module (and its tests) don't require a DB driver to be installed."""
    import psycopg

    return psycopg.connect(
        host=os.getenv("PGHOST", "127.0.0.1"),
        port=int(os.getenv("PGPORT", "5433")),
        dbname=os.getenv("PGDATABASE", "medtech"),
        user=os.getenv("PGUSER", "medtech_app"),
        password=os.environ["PGPASSWORD"],
    )


def fetch_raw() -> pd.DataFrame:
    """Pull raw appointment rows needed for feature engineering."""
    with _connect() as conn:
        return pd.read_sql(_QUERY, conn)


def main() -> None:
    ap = argparse.ArgumentParser(description="Export the no-show training dataset.")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output CSV path.")
    args = ap.parse_args()

    raw = fetch_raw()
    dataset = build_dataset(raw)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(args.out, index=False)

    pos = int(dataset[LABEL_COLUMN].sum())
    n = len(dataset)
    rate = (pos / n) if n else 0.0
    print(
        f"Wrote {n} labelled rows to {args.out} "
        f"({pos} NO_SHOW / {n - pos} COMPLETED, base rate {rate:.1%})."
    )
    if n < 200:
        print("WARNING: very small dataset — the trained model may not beat the heuristic.")


if __name__ == "__main__":
    main()
