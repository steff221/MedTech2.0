# MedTech Anomaly Intelligence (ml-service)

Stateless ML scoring service for the MedTech platform. Spring stays the
decision-maker; this service turns feature vectors into **scores + explanations**.
It is meant to be called **best-effort** — if it's down, Spring falls back to its
existing rule-based logic.

## Status: Phase 4 (no-show + access-anomaly models)

- `POST /score/no-show` — no-show risk for an appointment. Transparent heuristic out of
  the box; loads a **trained GradientBoosting model** when an artifact is present.
- `POST /score/access-anomaly` — anomaly score for a user's recent access behaviour.
  Transparent heuristic out of the box; loads a **trained Isolation Forest** when an
  artifact is present. Called best-effort by `AnomalyDetectionJob` alongside its rules.
- `GET /health` — liveness + active `model_version` and `access_model_version` (Spring
  uses this for its circuit breaker).

Both scorers swap heuristic→model with **no change to the API contract** (see
*Training a model* below).

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

## Training a model

Each scorer runs on its transparent heuristic until a trained artifact is present, then
loads it automatically — no serving-code or API changes.

```bash
# Training deps (Postgres driver on top of the serving deps)
pip install -r requirements-train.txt
# PG* env vars default to the docker-compose DB on 127.0.0.1:5433.

# --- No-show (GradientBoosting) ---
PGPASSWORD=... python -m training.extract            # -> data/noshow_dataset.csv
python -m training.train_noshow                      # -> app/scoring/artifacts/noshow_model.joblib

# --- Access anomaly (Isolation Forest) ---
PGPASSWORD=... python -m training.extract_access     # -> data/access_dataset.csv
python -m training.train_access                      # -> app/scoring/artifacts/access_model.joblib
```

Restart the service (or rebuild the image) and `/health` reports the new versions.
Override artifact paths with `NOSHOW_MODEL_PATH` / `ACCESS_MODEL_PATH`. Datasets and
`.joblib` files are git-ignored — train them per-environment, never commit them.

**Guardrails:** the trainers *refuse to save* a model that isn't trustworthy — too little
data, too few positive examples, or (no-show) not beating the heuristic / (access) not
tracking the rule baseline. In that case nothing is written and the service keeps using
the transparent heuristic. Pass `--force` to override for experiments (not for production).

## Layout

```
app/
  main.py            # FastAPI routes: /health, /score/no-show, /score/access-anomaly
  schemas.py         # pydantic contracts — THE Spring<->ML integration contract
  scoring/
    noshow.py        # heuristic + GradientBoosting backends behind one score()
    access.py        # heuristic + Isolation Forest backends behind one score()
    artifacts/       # trained *.joblib artifacts live here (git-ignored)
tests/
  test_noshow.py / test_access.py            # heuristic + API contract
  test_features.py / test_access_features.py # feature engineering (leakage/bucketing)
  test_training.py / test_train_access.py    # train -> artifact -> scoring (skip w/o sklearn)
training/
  features.py / access_features.py   # feature engineering (the dataset contracts)
  extract.py  / extract_access.py    # Postgres -> data/*.csv
  train_noshow.py / train_access.py  # train + offline eval -> joblib artifact
```

## Roadmap

- **Phase 1** ✅ — Spring `AnomalyScoreClient` + `ml.scoring.enabled` flag + V20
  `no_show_risk` column, calling this service from `AppointmentService.book()`.
- **Phase 2** ✅ — surface risk badge in the doctor/GP schedule UI.
- **Phase 3** ✅ — `training/` pipeline: export appointments → train GradientBoosting
  on `NO_SHOW` vs `COMPLETED` → load the artifact in `scoring/noshow.py`.
- **Phase 4** ✅ — Isolation Forest access-anomaly model wired into the existing
  `AnomalyDetectionJob`; offline evaluation vs. the rule baseline.
