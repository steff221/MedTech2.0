# MedTech 2.0 — Reviewer's guide to the role-based access system

**URL:** `https://<FILL-IN>`
**Password for every account below:** `magii1002`

All data is synthetic. No real patient information exists in this system.

---

## 1. The five roles

Each role lands on a different portal after login. The redirect happens in
`src/app/page.tsx` based on the role in the JWT.

| Role | Sign in as | Lands on | Purpose |
|------|-----------|----------|---------|
| `PATIENT` | `patient@medtech.mk` | `/dashboard` | Own health record, booking |
| `DOCTOR` | `zoran.perovski@medtech.mk` | `/doctor` | Urology specialist — full clinical portal |
| `GENERAL_PRACTITIONER` | `zoran@medtech.mk` | `/gp` | GP portal — same clinical rights, separate navigation |
| `NURSE` | `nurse@medtech.mk` | `/nurse` | Front desk — scheduling only, **no PHI** |
| `ADMIN` | `stefan.perovski20@gmail.com` | `/admin` | Staff, audit logs, national statistics |

---

## 2. How authorisation is enforced

Three independent layers. The first two are role checks; the third is what
actually prevents one doctor reading another doctor's patients.

**Layer 1 — route guard (frontend).** Each portal's `layout.tsx` redirects a
user whose role does not match. This is convenience, not security.

**Layer 2 — method security (backend).** Every endpoint carries a
`@PreAuthorize`. Role names are centralised in
`infrastructure/security/Roles.java` so the combinations are declared once:

```java
CLINICIAN  = hasAnyRole('DOCTOR', 'GENERAL_PRACTITIONER')
CARE_TEAM  = hasAnyRole('DOCTOR', 'GENERAL_PRACTITIONER', 'NURSE')
```

**Layer 3 — object-level guard.** Endpoints annotated `isAuthenticated()` look
identical to every logged-in user, so they delegate to
`PatientAccessGuard.assertCanAccessPatient()` (14 call sites), which asks *may
this specific user read this specific patient?*

| Role | Rule |
|------|------|
| `ADMIN` | any patient |
| `DOCTOR` / `GP` | **only patients they have an appointment with** — a care relationship must exist |
| `PATIENT` | only their own record |
| `NURSE` | **denied** (`NURSE_PHI_ACCESS_DISABLED`) — no ward-scoping entity exists yet, so blanket national PHI access is refused rather than granted by default |

The doctor rule is the important one: it makes changing the `id` in a URL
useless, because authorisation depends on the *relationship*, not on possession
of an identifier.

---

## 3. Suggested checks

### Positive — each role sees its own world

1. Sign in as **doctor** (`zoran.perovski@medtech.mk`). Today's clinic list,
   patients, medical journal, prescriptions, referrals, operations, reports.
2. Sign in as **nurse**. Today's appointments across *all* doctors — but no
   record-writing tools anywhere in the navigation.
3. Sign in as **patient**. Own appointments, prescriptions, referrals, health
   record. No access to anyone else's.
4. Sign in as **admin**. User management, audit log, national statistics.

### Negative — the interesting part

Every result in the table below was verified against a running instance.

To issue a request as the signed-in user, open DevTools → Network, click any
request the app made, and copy its `Authorization: Bearer …` header. (The access
token is deliberately **not** in `localStorage` — it is held in memory only, so
that an XSS bug cannot steal it. Only the refresh token is stored, in an
httpOnly cookie.) Then, in the console:

```js
const T = 'Bearer eyJ…';                       // pasted from the Network tab
await fetch('/api/admin/users', { headers: { Authorization: T } })
  .then(r => r.status);                        // 403 for any non-admin
```

| Signed in as | Request | Expected |
|---|---|---|
| `PATIENT` | `GET /api/admin/users` | `403` |
| `PATIENT` | `GET /api/audit-logs` | `403` |
| `PATIENT` | `GET /api/medical-records/my` | `403` — clinician-scoped |
| `DOCTOR` | `GET /api/admin/users` | `403` |
| `DOCTOR` | `GET /api/appointments/today` | `403` — front-desk view, nurse/admin only |
| `NURSE` | `POST /api/medical-records` | `403` — clinicians only |
| `NURSE` | `GET /api/patients/1/medical-records` | `403` — `NURSE_PHI_ACCESS_DISABLED` |
| anonymous | `GET /api/patients/me` | `401` |
| anonymous | `GET /api/admin/users` | `401` |

### The object-level test — the one that matters

Patient 12 (Мирна Стефановска) is treated by the GP, but the urologist has never
had an appointment with her. Signed in as **Dr. Zoran Perovski**
(`zoran.perovski@medtech.mk`, a fully privileged `DOCTOR`):

```
GET /api/patients/12/medical-records   →  403  PATIENT_ACCESS_DENIED
GET /api/patients/12/prescriptions     →  403  PATIENT_ACCESS_DENIED
```

Now sign in as the **GP** (`zoran@medtech.mk`) and request the same URL:

```
GET /api/patients/12/medical-records   →  200
```

Same endpoint, same privilege level, opposite outcomes. The difference is
whether a care relationship exists. This is what makes tampering with the `id`
in the URL useless — authorisation depends on the relationship, not on knowing
an identifier.

---

## 4. Supporting mechanisms

- **JWT + refresh rotation** — 15-minute access token; the refresh token is an
  httpOnly, `Secure`, `SameSite` cookie, so it is not reachable from JavaScript.
- **Audit trail** — every PHI read is recorded. As admin, open
  **Admin → Audit logs** to see the reads generated by this review, including
  actor, target and timestamp. `medical_record_events` is append-only, enforced
  by a database trigger that rejects `DELETE`.
- **PHI encryption at rest** — diagnoses and clinical notes are AES-256-GCM
  encrypted in the database, transparently via a JPA converter.
- **Rate limiting** — 10 requests per 60 s per IP on `/api/auth/**`. Repeated
  failed logins will return `429`; this is deliberate.

---

## 5. Known limitations

Stated plainly rather than hidden:

- **Nurse PHI access is unimplemented, not merely restricted.** There is no
  hospital/ward entity to scope a nurse to, so the guard denies rather than
  grants. Scoping that properly is the next piece of work.
- **Frontend route guards are cosmetic.** Every real check is server-side; the
  client redirect only avoids showing a page that would fail to load anyway.
- **`GET /api/appointments/{id}` is `isAuthenticated()`** and relies on a
  narrower ownership check than the patient guard — it is the weakest of the
  object-level rules.
