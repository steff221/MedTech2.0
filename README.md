# MedTech 2.0

[![CI / CD](https://github.com/steff221/MedTech2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/steff221/MedTech2.0/actions/workflows/ci.yml)
[![Backend image](https://img.shields.io/badge/ghcr.io-medtech--backend-blue?logo=docker)](https://github.com/steff221/MedTech2.0/pkgs/container/medtech-backend)
[![Frontend image](https://img.shields.io/badge/ghcr.io-medtech--frontend-blue?logo=docker)](https://github.com/steff221/MedTech2.0/pkgs/container/medtech-frontend)

Hospital management platform inspired by **MojTermin.mk** — patient portal, clinician portal, doctor directory map, and a full appointment / prescription / medical-record system. Built end-to-end in a multi-day session with Claude Code.

## Stack

| Layer | Tech |
|---|---|
| **Backend** | Spring Boot 3 · Java 21 · PostgreSQL 16 · JWT auth · 38 tests |
| **Frontend** | Next.js 14 (App Router) · TypeScript strict · Tailwind v3.4 · Framer Motion · TanStack Query · Zustand · React Hook Form + Zod · Leaflet |
| **Infra** | Docker Compose (full stack) · GitHub Actions CI/CD · GHCR image publishing |

## Quick start — one command

```bash
cd docker && docker compose up -d --build
```

Then open **http://localhost:3000/login**. First build is ~5 min (Maven + npm installs); subsequent starts are ~15 seconds.

## Demo logins

All seeded by `backend/src/main/resources/database/mock_seed.sql`.

| Role | Email | Password |
|---|---|---|
| **Patient** | `patient@medtech.mk` | `patient123` |
| **Doctor** | `stefan@medtech.mk` | `magi1002` |

## CI / CD pipeline

Every push to `main`:

1. **Backend tests** run (`mvn -B test`) — 38 unit + slice tests
2. **Frontend** type-checks (`tsc --noEmit`) + builds (`next build`)
3. **If both pass**, two Docker images are built in parallel and pushed to GitHub Container Registry:
   - `ghcr.io/steff221/medtech-backend:latest` (and `:sha-<short>`)
   - `ghcr.io/steff221/medtech-frontend:latest` (and `:sha-<short>`)

PRs run steps 1–2 only (no publish until merged).

Pull the latest published images:

```bash
docker pull ghcr.io/steff221/medtech-backend:latest
docker pull ghcr.io/steff221/medtech-frontend:latest
```

## Features

### Patient portal (`/dashboard`, `/appointments`, `/doctors`, `/health-records`, `/prescriptions`, `/profile`)
- Dashboard with animated count-up tiles and upcoming appointments
- Multi-step appointment booking wizard (specialty → doctor → date/time → confirm)
- Doctor directory: **Leaflet map of Macedonia** with hospital pins + filters (specialty, procedure, hospital)
- Health records timeline with vitals + SOAP sections
- Prescriptions list with active/history filters

### Doctor portal (`/doctor/*`) — MojTermin-style
- Horizontal top nav with 10 menu groups (Macedonian labels)
- Tile launcher home + cyan/teal page banners with breadcrumbs
- **Weekly schedule calendar** — 7-day grid, 20-min slots, color-coded by status, rich hover tooltip
- **Patients panel** — derived from appointments, drawer with overview / appointments / records / prescriptions
- **SOAP medical record form** with MKB10 autocomplete (28 ICD-10 codes across 11 specialties)
- **Prescription form** with patient allergy warnings

### Public landing (`/`)
- Animated SVG map of North Macedonia with hospital nodes as glowing pins
- Neural-net "data packets" flow between connected hospitals
- Live KPI counters polling `/api/stats/overview` every 30 seconds
- Two animated bar charts: appointments by hospital + prescriptions by day

### Seed data
- 10 hospitals across North Macedonia
- 8 doctors across 7 specialties
- 12 patients
- 60+ appointments (Stefan's calendar populated today + this week), 15 medical records, 20 prescriptions

## Project structure

```
MedTech2.0/
├── backend/                    # Spring Boot 3 + Java 21
│   ├── Dockerfile              # Multi-stage, non-root, healthcheck
│   ├── src/main/java/com/medtech/
│   │   ├── domain/             # Entities, value objects, repositories
│   │   ├── application/        # Services, DTOs, mappers
│   │   ├── infrastructure/     # Security, config, persistence converters
│   │   └── presentation/       # REST controllers
│   ├── src/main/resources/
│   │   ├── application.yml + application-prod.yml
│   │   └── database/
│   │       ├── medtech_schema_pg.sql   # Full schema (PG enums, triggers, indexes)
│   │       └── mock_seed.sql           # Idempotent demo data
│   └── src/test/               # 38 unit + slice tests
│
├── frontend/                   # Next.js 14 App Router
│   ├── Dockerfile              # Multi-stage, standalone output, non-root
│   ├── src/app/
│   │   ├── (auth)/             # Login / register (dark glass theme)
│   │   ├── (patient)/          # Patient portal route group
│   │   ├── doctor/             # Doctor portal segment
│   │   ├── not-found.tsx       # Branded 404
│   │   └── template.tsx        # Page-transition fade
│   ├── src/components/
│   │   ├── common/             # Design system (Button, Card, Modal, etc.)
│   │   ├── landing/            # Macedonia mesh, KPI counter, bar chart
│   │   ├── layout/             # PageBanner, DoctorTopNav, sidebars
│   │   ├── patient/            # AppointmentCard, BookingWizard, HospitalsMap
│   │   └── doctor/             # WeeklyCalendar, PatientDetailDrawer, SOAP/Rx forms
│   ├── src/hooks/              # useAuth, useDoctor, useDoctorPatients
│   ├── src/services/           # Axios clients per resource
│   └── src/types/api.ts        # All API DTO types
│
├── docker/
│   └── docker-compose.yml      # Postgres + pgAdmin + backend + frontend
│
└── .github/workflows/ci.yml    # CI: tests + build → CD: publish to GHCR
```

## Reset the database

```bash
cd docker && docker compose down -v && docker compose up -d
```

Volumes wiped, schema + mock seed re-run, fresh demo state.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page loads but blank / 404s on `_next/...` chunks | `cd frontend && rm -rf .next && npm run dev` |
| Backend won't start, "Port 8080 in use" | `kill $(lsof -ti:8080)` then retry |
| Postgres "container is not running" | `cd docker && docker compose up -d` |
| Backend ClassNotFoundException after edits | `cd backend && mvn clean package -DskipTests` then re-run |
| Want to develop locally without Docker | Run backend with `mvn spring-boot:run` and frontend with `npm run dev`; keep Postgres in Docker |
