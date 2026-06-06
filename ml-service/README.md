# MedTech Anomaly Intelligence (ml-service)

Stateless ML scoring service for the MedTech platform. Spring stays the
decision-maker; this service turns feature vectors into **scores + explanations**.
It is meant to be called **best-effort** — if it's down, Spring falls back to its
existing rule-based logic.

## Status: Phase 3 (trained model available)

- `POST /score/no-show` — returns no-show risk for an appointment.
  Backed by a **transparent heuristic** out of the box; loads a **trained
  GradientBoosting model** when an artifact is present (see *Training a model* below),
  with **no change to the API contract**.
- `GET /health` — liveness + active `model_version` (Spring uses this for its
  circuit breaker).

Interactive docs at `http://localhost:8000/docs` once running.

## Run locally

```bash
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Smoke test:

```bash
curl localhost:8000/health
curl -X POST localhost:8000/score/no-show \
  -H 'Content-Type: application/json' \
  -d '{"features":{"historical_no_show_rate":0.8,"lead_time_days":30,"day_of_week":1,"hour_of_day":8,"appointment_type":"SPECIALIST","prior_reschedule_count":3,"prior_appointment_count":20}}'
```

## Test

```bash
pip install -r requirements.txt
pytest
```

## Docker

```bash
docker build -t medtech-ml .
docker run -p 8000:8000 medtech-ml
```

## Training a model (Phase 3)

The scorer runs on the transparent heuristic until a trained artifact is present, then
loads it automatically — no serving-code or API changes. Build one in two steps:

```bash
# Training deps (Postgres driver on top of the serving deps)
pip install -r requirements-train.txt

# 1) Export a leakage-free dataset from Postgres (point-in-time features).
#    PG* env vars default to the docker-compose DB on 127.0.0.1:5433.
PGPASSWORD=... python -m training.extract            # -> data/noshow_dataset.csv

# 2) Train + evaluate vs the heuristic, and save the runtime artifact.
python -m training.train_noshow                      # -> app/scoring/artifacts/noshow_model.joblib
```

Restart the service (or rebuild the image) and `/health` will report the new
`model_version`. Point at a different artifact with `NOSHOW_MODEL_PATH`. The dataset and
`.joblib` are git-ignored — train them per-environment, never commit them.

## Layout

```
app/
  main.py            # FastAPI routes: /health, /score/no-show
  schemas.py         # pydantic contracts — THE Spring<->ML integration contract
  scoring/
    noshow.py        # heuristic + trained-model backends behind one score()
    artifacts/       # trained noshow_model.joblib lives here (git-ignored)
tests/
  test_noshow.py     # heuristic + API contract
  test_features.py   # point-in-time feature engineering (leakage checks)
  test_training.py   # train -> artifact -> model scoring (skipped without sklearn)
training/
  features.py        # point-in-time feature engineering (the dataset contract)
  extract.py         # Postgres -> data/noshow_dataset.csv
  train_noshow.py    # GradientBoosting + eval vs heuristic -> joblib artifact
```

## Roadmap

- **Phase 1** ✅ — Spring `AnomalyScoreClient` + `ml.scoring.enabled` flag + V20
  `no_show_risk` column, calling this service from `AppointmentService.book()`.
- **Phase 2** ✅ — surface risk badge in the doctor/GP schedule UI.
- **Phase 3** ✅ — `training/` pipeline: export appointments → train GradientBoosting
  on `NO_SHOW` vs `COMPLETED` → load the artifact in `scoring/noshow.py`.
- **Phase 4** — Isolation Forest access-anomaly model wired into the existing
  `AnomalyDetectionJob`; offline evaluation vs. the rule baseline.
