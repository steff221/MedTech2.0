# MedTech 2.0

[![CI](https://github.com/steff221/MedTech2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/steff221/MedTech2.0/actions/workflows/ci.yml)

Hospital management platform inspired by **MojTermin.mk** — patient portal, clinician portal, doctor directory map, and a full appointment / prescription / medical-record system. Built end-to-end in a multi-day session with Claude Code.

## Stack

| Layer | Tech |
|---|---|
| **Backend** | Spring Boot 3 · Java 21 · PostgreSQL 16 · JWT auth · 39 tests |
| **Frontend** | Next.js 14 (App Router) · TypeScript strict · Tailwind v3.4 · Framer Motion · TanStack Query · Zustand · React Hook Form + Zod · Leaflet |
| **Infra** | Docker Compose (Postgres + pgAdmin) · GitHub Actions CI |

## Quick start (3 terminals)

```bash
# 1. Postgres
cd docker && docker compose up -d

# 2. Backend (http://localhost:8080)
cd backend && mvn spring-boot:run

# 3. Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

Then open **http://localhost:3000/login**.

## Demo logins

All seeded by `backend/src/main/resources/database/mock_seed.sql`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@medtech.mk` | `admin123` |
| Doctor | `stefan@medtech.mk` | `magi1002` |
| Doctor (with seeded data) | `dr.iaziri@medtech.mk` | `Doctor!Pass#2026` |
| Patient | `p.kostadinov@medtech.mk` | `Demo!Pass#2026` |

## Features

### Patient portal (`/dashboard`, `/appointments`, `/doctors`, `/profile`)
- Dashboard with quick-action tiles and upcoming appointments
- Multi-step appointment booking wizard (specialty → doctor → date/time → confirm)
- Doctor directory: **Leaflet map of Macedonia** with hospital pins + filters (specialty, procedure, hospital)
- Profile management

### Doctor portal (`/doctor/*`) — MojTermin-style
- Horizontal top nav with 10 menu groups (Macedonian labels)
- Tile launcher home + cyan/teal page banners with breadcrumbs
- **Weekly schedule calendar** — 7-day grid, 20-min slots, color-coded by status
- **Patients panel** — derived from appointments, drawer with overview / appointments / records / prescriptions
- **SOAP medical record form** with MKB10 autocomplete (28 ICD-10 codes across 11 specialties)
- **Prescription form** with patient allergy warnings
- Stub pages for Издадени упати, Медицински дневник, МКБ10 Дијагноза, Операции

### Seed data
- 10 hospitals across North Macedonia (Skopje, Tetovo, Kumanovo, Bitola, Ohrid, Štip, Prilep, Strumica, Gostivar, Veles)
- 8 doctors across 7 specialties
- 12 patients
- 40 appointments, 15 medical records, 20 prescriptions

## Project structure

```
MedTech2.0/
├── backend/                    # Spring Boot 3 + Java 21
│   ├── src/main/java/com/medtech/
│   │   ├── domain/             # Entities, value objects, repositories
│   │   ├── application/        # Services, DTOs, mappers
│   │   ├── infrastructure/     # Security, config, persistence converters, exceptions
│   │   └── presentation/       # REST controllers
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── database/
│   │       ├── medtech_schema_pg.sql   # Full schema (PG enums, triggers, indexes)
│   │       └── mock_seed.sql            # Idempotent demo data
│   └── src/test/               # 39 unit + slice tests
│
├── frontend/                   # Next.js 14 App Router
│   ├── src/app/
│   │   ├── (auth)/             # Login / register
│   │   ├── (patient)/          # Patient portal route group
│   │   └── doctor/             # Doctor portal segment
│   ├── src/components/
│   │   ├── common/             # Design system (Button, Card, Modal, etc.)
│   │   ├── layout/             # PageBanner, DoctorTopNav, sidebars
│   │   ├── patient/            # AppointmentCard, BookingWizard, HospitalsMap, …
│   │   └── doctor/             # WeeklyCalendar, PatientDetailDrawer, SOAP/Rx forms, …
│   ├── src/hooks/              # useAuth, useDoctor, useDoctorPatients, usePatient
│   ├── src/services/           # Axios clients per resource
│   ├── src/store/              # Zustand auth store
│   ├── src/types/              # All API DTO types
│   └── src/utils/              # cn, format, mkb10 catalog, procedures catalog
│
├── docker/
│   └── docker-compose.yml      # Postgres 16 + pgAdmin
│
└── .github/workflows/ci.yml    # Backend tests + frontend type-check + build
```

## Reset the database

```bash
docker exec -i medtech-postgres psql -U medtech_app -d medtech \
  < backend/src/main/resources/database/mock_seed.sql
```

(The seed is idempotent — safe to re-run.)

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page loads but blank / 404s on `_next/...` chunks | `cd frontend && rm -rf .next && npm run dev` |
| Backend won't start, "Port 8080 in use" | `kill $(lsof -ti:8080)` then retry |
| Postgres "container is not running" | `cd docker && docker compose up -d` |
| Backend ClassNotFoundException after edits | `cd backend && mvn clean package -DskipTests` then re-run |
