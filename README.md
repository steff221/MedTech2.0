<div align="center">

<img src="MedTech.png" alt="MedTech Logo" width="120" />

# MedTech 2.0

**A digital health platform for North Macedonia**

Appointment booking · Doctor portals · Medical records · Live admin analytics

<img width="1440" height="786" alt="landing page" src="https://github.com/user-attachments/assets/65a4bb88-66c1-432e-946e-60e92e269e2b" />
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## Overview

MedTech is a healthcare management platform built around the real workflows of clinics and hospitals in North Macedonia. It brings together **patients**, **doctors**, and **hospital administrators** into one connected system.

Patients book appointments, track their prescriptions, and view their health history. Doctors manage their full day — calendar, patient records, SOAP notes, and prescriptions — from a single portal. Administrators monitor live statistics across every hospital in the network in real time.

The system covers the complete clinical journey: from a patient discovering a specialist on an interactive map of Macedonia, to a doctor writing a prescription with allergy warnings, to an admin reviewing national appointment trends by hospital.

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Public Landing</b></td>
    <td align="center"><b>Patient Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/landing.png" alt="Landing page" width="440" /></td>
    <td><img src="docs/screenshots/patient.png" alt="Patient portal" width="440" /></td>
  </tr>
  <tr>
    <td align="center"><b>Doctor Portal</b></td>
    <td align="center"><b>Admin Panel</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/doctor.png" alt="Doctor portal" width="440" /></td>
    <td><img src="docs/screenshots/admin.png" alt="Admin panel" width="440" /></td>
  </tr>
</table>

---

## The four portals

### Public landing
The entry point for the platform. An animated SVG map of North Macedonia displays every hospital in the network as glowing nodes with live data flowing between them. Live KPI counters update every 30 seconds, pulling real numbers from the system — total patients, doctors, appointments, and prescriptions. Supports dark mode.

### Patient portal
A patient signs in and lands on a personal dashboard showing their next appointment, active prescriptions, and quick links to every part of their health profile.

- **Book an appointment** — a guided wizard that walks through specialty, doctor, date, and time
- **Find a doctor** — an interactive Leaflet map of Macedonia with hospital markers, filterable by specialty, procedure, and location
- **Health records** — a chronological timeline of every visit, with vitals and clinical notes
- **Prescriptions** — all active and past prescriptions with full dosage details
- **Referrals** — view incoming referrals from other doctors and track their status

### Doctor portal
Built to feel like a real clinical workstation. The top navigation covers every workflow a doctor needs during their shift.

- **Home** — daily at-a-glance: appointments today, remaining in the day, pending referrals, and a flagged list of high-risk patients with their latest abnormal readings
- **Calendar** — a 7-day weekly grid in 20-minute slots, colour-coded by appointment status, with detailed hover tooltips
- **Patients** — full patient profiles accessible from a searchable list, with tabs for overview, appointment history, medical records, and prescriptions
- **Medical diary** — write structured SOAP notes with MKB10 / ICD-10 diagnosis autocomplete covering 11 specialties
- **Prescriptions** — a prescription writer that surfaces the patient's known allergies before confirming
- **Operations** — log and review surgical procedures
- **Sick leave** — generate official sick leave documents
- **Working schedule** — manage availability and shifts
- **Bi-lingual** — full Macedonian and English support, switchable from any page

### Admin panel
A real-time system dashboard that refreshes every 60 seconds.

- Live counters for active patients, active doctors, prescriptions issued today, and appointments today
- 7-day line charts for appointment volume and prescription volume
- Top specializations ranked by number of active doctors
- Appointments by hospital — a ranked breakdown across the entire network for the last 30 days
- User management, audit log, and anomaly detection tabs

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.3 · Java 21 · Spring Security · JWT (access + refresh) · JPA / Hibernate |
| **Database** | PostgreSQL 16 · native PG enums · triggers · indexes |
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · Framer Motion |
| **State & data** | TanStack Query · Zustand · Axios |
| **Forms** | React Hook Form · Zod |
| **Maps** | Leaflet.js |
| **Testing** | JUnit 5 · Mockito · Spring Security Test |
| **Infra** | Docker Compose · GitHub Actions CI/CD · GitHub Container Registry |

## Deployment

Production runs from `docker/docker-compose.yml` (TLS via nginx + Let's Encrypt,
daily database backups, PHI encrypted at rest, no demo data). Full runbook:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

<div align="center">

Built with [Claude Code](https://claude.ai/claude-code) · Spring Boot · Next.js · PostgreSQL

</div>
