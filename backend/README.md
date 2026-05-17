# MedTech Backend — Spring Boot 3 REST API

Spring Boot 3.3 / Java 21 REST API backend for the MedTech Medical
Administration System, backed by the PostgreSQL 16 schema defined in
`src/main/resources/database/medtech_schema_pg.sql`.

## Status

**Phase 1 + 2 delivered:** core infrastructure, all 9 JPA entities,
value objects, repositories, JWT security, authentication endpoints,
structured error handling, OpenAPI docs, Dockerfile.

Phases 3–7 (services for Patient/Doctor/Appointment/MedicalRecord/Prescription/
Operation/Hospital/AuditLog, their controllers, AOP audit, integration tests,
CI/CD) are scheduled for follow-up iterations.

## Stack

- Spring Boot 3.3.5 — Web, Data JPA, Security, Validation, Actuator, AOP
- PostgreSQL 16 (driver managed by SB BOM)
- Hibernate 6 with native PG enum mapping (`@JdbcTypeCode(NAMED_ENUM)`)
- jjwt 0.12 (HS256 access + refresh tokens)
- SpringDoc OpenAPI 2 (Swagger UI)
- Lombok, MapStruct (wired for Phase 4)
- JUnit 5, Mockito, Spring Security Test

## Prerequisites

- JDK 21+
- Maven 3.9+
- The PostgreSQL stack from `../docker/docker-compose.yml` running
  (`postgres:16-alpine` on host port **5433**)

## Running

```bash
# from repo root
docker compose -f docker/docker-compose.yml up -d

# from backend/
mvn spring-boot:run
```

Default profile: `dev` — see `application.yml`.
Override secrets in production via env vars:

| Variable | Purpose |
|---|---|
| `MEDTECH_DB_URL` | JDBC URL |
| `MEDTECH_DB_USER` | DB user |
| `MEDTECH_DB_PASSWORD` | DB password |
| `MEDTECH_SECURITY_JWT_SECRET` | ≥ 32-char HMAC secret |

## Endpoints (Phase 1 — Authentication)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Self-register PATIENT / DOCTOR / NURSE |
| POST | `/api/auth/login` | Exchange credentials for tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Stateless no-op |
| GET  | `/actuator/health` | Liveness probe |
| GET  | `/swagger-ui.html` | API documentation |

Seed admin (from `medtech_schema_pg.sql`):
- email: `admin@medtech.mk`
- password: the BCrypt hash baked into the seed corresponds to the
  development-only password supplied with the schema. **Reset before any
  non-local deployment.**

## Smoke test

```bash
# Register a patient
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "jane.doe@example.com",
    "password": "Str0ng!Passw0rd#2026",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "PATIENT"
  }' | jq .

# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jane.doe@example.com","password":"Str0ng!Passw0rd#2026"}' | jq .
```

## Architecture

```
com.medtech
├── domain/            entities, value objects, repositories (interfaces only)
├── application/       services, DTOs (request/response)
├── infrastructure/    security, exception, config (cross-cutting)
└── presentation/      REST controllers
```

### Hibernate ↔ PostgreSQL ENUM mapping

Every PG-native enum column is mapped with:

```java
@Enumerated(EnumType.STRING)
@JdbcTypeCode(SqlTypes.NAMED_ENUM)
@Column(columnDefinition = "user_role_enum")
private UserRole role;
```

`BloodType` is an exception: PG literals contain `+`/`-`, illegal in Java
identifiers — `Patient.bloodType` is therefore a `String` field, wrapped by
the `BloodType` value object at the service / DTO boundary.

### Schema ownership

`spring.jpa.hibernate.ddl-auto: none` — all DDL is owned by
`backend/src/main/resources/database/medtech_schema_pg.sql`, applied
automatically by `docker-entrypoint-initdb.d` on the first container start.
The application never alters the schema.

## Testing

```bash
mvn test
```

## Build container image

```bash
docker build -t medtech/backend:2.0.0 .
```

## Future work (next phases)

- Phase 3 — services (`PatientService`, `DoctorService`, `AppointmentService`,
  `MedicalRecordService`, `PrescriptionService`, `OperationService`,
  `HospitalService`, `AuditLogService`) with the business rules listed in
  the system prompt.
- Phase 4 — full controller surface + DTO mappers (MapStruct).
- Phase 5 — AOP audit aspect, per-IP login rate limiting (Bucket4j),
  performance aspect.
- Phase 6 — Postman collection, Javadoc, ER diagram in docs.
- Phase 7 — GitHub Actions CI pipeline, environment templates.
