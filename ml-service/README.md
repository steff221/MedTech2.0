# MedTech Anomaly Intelligence (ml-service)

Stateless ML scoring service for the MedTech platform. Spring stays the
decision-maker; this service turns feature vectors into **scores + explanations**.
It is meant to be called **best-effort** — if it's down, Spring falls back to its
existing rule-based logic.

## Status: Phase 0 (scaffold)

- `POST /score/no-show` — returns no-show risk for an appointment.
  Backed by a **transparent heuristic** today; swaps to a trained model in Phase 3
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

## Layout

```
app/
  main.py            # FastAPI routes: /health, /score/no-show
  schemas.py         # pydantic contracts — THE Spring<->ML integration contract
  scoring/
    noshow.py        # Phase 0 heuristic; Phase 3 loads a trained model here
tests/
  test_noshow.py
training/            # Phase 3: extract.py / train_noshow.py (not yet present)
```

## Roadmap

- **Phase 1** — Spring `AnomalyScoreClient` + `ml.scoring.enabled` flag + V20
  `no_show_risk` column, calling this service from `AppointmentService.book()`.
- **Phase 2** — surface risk badge in the doctor/GP schedule UI.
- **Phase 3** — `training/` pipeline: export appointments → train GradientBoosting
  on `NO_SHOW` vs `COMPLETED` → load `.pkl` in `scoring/noshow.py`.
- **Phase 4** — Isolation Forest access-anomaly model wired into the existing
  `AnomalyDetectionJob`; offline evaluation vs. the rule baseline.
