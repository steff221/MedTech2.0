# MedTech PostgreSQL Database — Complete Setup Guide
## Professional Enterprise-Grade Implementation (Migrated from Oracle 21c)

> **Architect's note.** This guide reflects 25+ years of operating clinical
> administration systems in production. The platform was originally engineered
> on Oracle 21c; in Version 2.0 it is migrated to PostgreSQL 16 to reduce
> licensing risk, simplify CI/CD, accelerate developer onboarding, and remain
> fully compliant with Macedonian Ministry of Health data-residency
> expectations. All domain semantics, audit obligations, and indexing strategy
> have been preserved 1:1; only the storage engine changed.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Docker Setup](#local-docker-setup-recommended-for-development)
3. [Database Schema Overview](#database-schema-overview)
4. [Security Best Practices](#security-best-practices)
5. [Performance Tuning](#performance-tuning)
6. [Deployment Checklist](#deployment-checklist)
7. [Troubleshooting](#troubleshooting)
8. [Support & Resources](#support--resources)
9. [Version History](#version-history)

---

## Prerequisites

### Required Software

- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **Docker Compose**: bundled with Docker Desktop
- **Git**: https://git-scm.com
- **pgAdmin 4** (browser-based, bundled in the Compose stack on port `5050`)
- **`psql` client** (optional; the container ships its own — `docker exec` is enough)
- **Maven 3.8+**
- **JDK 21+**: https://adoptium.net

### System Requirements

- **RAM**: 2 GB minimum (4 GB recommended)
- **Disk**: 5 GB free (PostgreSQL is dramatically lighter than Oracle XE)
- **CPU**: 2 cores
- **Network**: stable internet for the first image pull

---

## Local Docker Setup (Recommended for Development)

### Step 1 — Install Docker Desktop

```bash
docker --version
# Docker version 24.x.x or newer

docker compose version
# Docker Compose version v2.x.x
```

### Step 2 — Project Layout

```
MedTech2.0/
├── backend/
│   └── src/main/resources/database/
│       └── medtech_schema_pg.sql       # PostgreSQL DDL + seed
├── docker/
│   └── docker-compose.yml              # postgres:16-alpine + pgAdmin
└── MEDTECH_POSTGRESQL_SETUP_GUIDE.md
```

### Step 3 — `docker/docker-compose.yml`

A production-shaped stack: PostgreSQL 16 Alpine with healthchecks, named
volume, and a private bridge network; pgAdmin 4 as the browser GUI.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: medtech-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: medtech
      POSTGRES_USER: medtech_app
      POSTGRES_PASSWORD: MedTech123!@#
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5433:5432"          # host:container — 5433 avoids clashing with a native Postgres install
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../backend/src/main/resources/database/medtech_schema_pg.sql:/docker-entrypoint-initdb.d/01_medtech_schema_pg.sql:ro
    networks: [medtech-network]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medtech_app -d medtech"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: medtech-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@medtech.mk
      PGADMIN_DEFAULT_PASSWORD: MedTech123!@#
    ports:
      - "5050:80"
    depends_on:
      postgres: { condition: service_healthy }
    networks: [medtech-network]
    volumes:
      - pgadmin_data:/var/lib/pgadmin

networks:
  medtech-network: { driver: bridge }

volumes:
  postgres_data: { driver: local }
  pgadmin_data:  { driver: local }
```

> The schema file is bind-mounted into `/docker-entrypoint-initdb.d/` so
> PostgreSQL applies it automatically on the **first** startup (when the data
> volume is empty). Re-running after the first init requires
> `docker compose down -v` to drop the volume.

### Step 4 — Start the Stack

```bash
cd docker
docker compose up -d
docker compose logs -f postgres
# Wait for: "database system is ready to accept connections"
```

### Step 5 — Verify the Database

```bash
docker exec -it medtech-postgres psql -U medtech_app -d medtech
```

Inside `psql`:

```sql
SELECT COUNT(*) FROM information_schema.tables   WHERE table_schema   = 'public';
SELECT COUNT(*) FROM pg_indexes                  WHERE schemaname     = 'public';
SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
SELECT typname FROM pg_type WHERE typcategory = 'E' ORDER BY typname;
\dt
\dv
\d+ users
\q
```

Expected baseline (Version 2.0):

| Metric                  | Expected |
|-------------------------|----------|
| Base tables + views     | 12 (9 + 3) |
| Indexes                 | ~71 |
| Trigger event rows      | 15 |
| ENUM types              | 13 |

### Step 6 — pgAdmin 4 (Browser GUI)

1. Open <http://localhost:5050>
2. Login: `admin@medtech.mk` / `MedTech123!@#`
3. **Add New Server**:
   - **Name**: `MedTech Local`
   - **Host**: `postgres` (container DNS name on the shared network)
   - **Port**: `5432`
   - **Maintenance DB**: `medtech`
   - **Username**: `medtech_app`
   - **Password**: `MedTech123!@#`

pgAdmin replaces Oracle SQL Developer / SQL\*Plus / Oracle Enterprise Manager
for all administrative workflows: query, EXPLAIN, ERD, backups, role
management.

### Step 7 — Spring Boot Configuration

**`application-dev.yml`**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/medtech
    username: medtech_app
    password: MedTech123!@#
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE
```

> If you run Spring Boot inside the same Docker network, replace
> `localhost:5433` with `postgres:5432`.

### Step 8 — `pom.xml` Dependency

PostgreSQL's JDBC driver is fully managed by the Spring Boot BOM, so **no
version is required**:

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

The Oracle artifacts (`com.oracle.database.jdbc:ojdbc11`) must be removed from
`pom.xml` together with any `OracleDriver` / `OracleDialect` references and
the `wallet/` resource directory.

### Step 9 — Run the Application

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

---

## Database Schema Overview

### Migration Highlights (Oracle → PostgreSQL)

| Oracle Construct                          | PostgreSQL Replacement |
|-------------------------------------------|------------------------|
| `NUMBER` PK + sequence + trigger          | `BIGINT GENERATED ALWAYS AS IDENTITY` |
| `VARCHAR2(n)`                             | `VARCHAR(n)` |
| `CLOB`                                    | `TEXT` |
| `CHAR(1)` Y/N flags                       | `BOOLEAN` |
| `NUMBER(10,2)`                            | `NUMERIC(10,2)` |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`     | `TIMESTAMPTZ DEFAULT NOW()` |
| `SYSDATE` / `CURRENT_TIMESTAMP`           | `NOW()` |
| `CHECK (... IN (...))` enums              | Native `CREATE TYPE ... AS ENUM` |
| `VARCHAR2(500)` vital signs               | `JSONB` |
| `CLOB` audit old/new                      | `JSONB` |
| Oracle `||` concat in views               | Same operator (kept verbatim) |
| `ORDER BY` inside `CREATE VIEW`           | Removed (invalid in PG views) |
| PL/SQL `:NEW`/`:OLD` triggers             | `plpgsql` `NEW`/`OLD` records, `TG_OP` |
| `DBMS_STATS.GATHER_*`                     | `ANALYZE` |
| `ALTER INDEX ... REBUILD`                 | `REINDEX INDEX CONCURRENTLY` |
| Tablespaces (`_TS`/`_IDX`)                | Dropped — single tablespace on Postgres |
| `audit_logs_seq.NEXTVAL`                  | Auto-IDENTITY in `audit_logs.id` |

### Core Entities

#### 1. `users` — Authentication & Authorization
Email-based login, BCrypt hashes, failed-login lockout, role-based access.

- `role` → `user_role_enum` (`PATIENT`, `DOCTOR`, `ADMIN`, `NURSE`)
- `status` → `user_status_enum` (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
- `email_verified` → `BOOLEAN`

#### 2. `patients` — Demographics & Clinical Profile
- `gender` → `gender_enum` (`M`, `F`, `O`)
- `blood_type` → `blood_type_enum` (8 ABO/Rh values)
- `allergies`, `chronic_conditions` → `TEXT`

#### 3. `doctors` — Provider Master
License, specialization, hospital affiliation, consultation fee.

#### 4. `hospitals` — Macedonian Facility Registry
Includes lat/long for map discovery, hospital tier
(`PRIMARY`/`SECONDARY`/`TERTIARY`/`PRIVATE`/`CLINIC`).

#### 5. `appointments` — Scheduling Engine
Patient × Doctor × Hospital, lifecycle managed by `appointment_status_enum`,
fully audited by `fn_appointments_audit`.

#### 6. `medical_records` — Clinical Documentation
SOAP-shaped, **MKB-10** (ICD-10 MK) codes, `vital_signs` as `JSONB` for rich
device-integration payloads, `is_confidential` flag.

#### 7. `prescriptions` — Medication Management
Route enum, refill counters, pharmacy fulfilment fields, status-change audit.

#### 8. `operations` — Surgical Procedures
Pre/intra/post-op `TEXT` notes, surgical team, anesthesia, complications.

#### 9. `audit_logs` — Compliance Trail
`old_values` / `new_values` are `JSONB`. ENUM-typed `action_type`, `status`.
Indexed by `(entity_type, action_type, created_at DESC)` for forensic queries.

### Indexing Strategy

1. **Single-column** indexes on every FK and every high-selectivity column.
2. **Composite** indexes on the hot reporting paths
   (`(doctor_id, appointment_date)`, `(patient_id, created_at DESC)`,
   `(entity_type, action_type, created_at DESC)`).
3. **Descending** indexes on time columns for chronological scans
   (PostgreSQL supports `DESC` natively without function-based wrappers).
4. **JSONB GIN** indexes can be added on `vital_signs` and audit payloads as
   workload demands — left out of the baseline to minimise write amplification.

### Views

- `vw_patient_appointments` — patient portal feed
- `vw_doctor_schedule` — doctor's daily roster with `COUNT() OVER (PARTITION …)`
- `vw_patient_medical_history` — chronological SOAP history (ordering handled by callers, not the view)

### Triggers

| Trigger | Purpose |
|---------|---------|
| `fn_set_updated_at` | Generic `BEFORE UPDATE` on every domain table |
| `fn_users_audit` | Logs INSERT / status-or-password UPDATE |
| `fn_appointments_audit` | Logs INSERT / UPDATE / DELETE with JSONB payloads |
| `fn_prescriptions_audit` | Logs INSERT / status-change UPDATE |

---

## Security Best Practices

### 1. Password Security (unchanged)

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

- Minimum 12 characters, mixed-case, digit, special character.

### 2. JWT Token Security (unchanged)

```yaml
jwt:
  expiration: 86400000          # 24h
  refresh-expiration: 604800000 # 7d
  secret: ${JWT_SECRET}
```

### 3. Database Roles & Privileges (PostgreSQL)

```sql
-- Application role (already created by the container env var)
ALTER ROLE medtech_app WITH LOGIN PASSWORD 'MedTech123!@#';

-- Read-only reporting role
CREATE ROLE medtech_readonly NOLOGIN;
GRANT CONNECT ON DATABASE medtech TO medtech_readonly;
GRANT USAGE ON SCHEMA public TO medtech_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO medtech_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO medtech_readonly;

-- Clinician role (insert/update on operational tables only)
CREATE ROLE medtech_doctor NOLOGIN;
GRANT CONNECT ON DATABASE medtech TO medtech_doctor;
GRANT USAGE ON SCHEMA public TO medtech_doctor;
GRANT SELECT, INSERT, UPDATE ON appointments, medical_records, prescriptions TO medtech_doctor;
GRANT SELECT ON patients, doctors, hospitals TO medtech_doctor;

-- Patient self-service role
CREATE ROLE medtech_patient NOLOGIN;
GRANT CONNECT ON DATABASE medtech TO medtech_patient;
GRANT USAGE ON SCHEMA public TO medtech_patient;
GRANT SELECT, INSERT ON appointments TO medtech_patient;
GRANT SELECT ON medical_records, prescriptions TO medtech_patient;

-- Lock down DDL/destructive verbs at the role level
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

### 4. CORS Configuration (unchanged)

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://medtech.mk", "https://www.medtech.mk")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### 5. SSL/TLS

```yaml
server:
  ssl:
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: medtech-cert
```

Production-grade TLS to the database itself is configured via PostgreSQL's
`ssl = on` and the JDBC URL parameter `?sslmode=verify-full`.

### 6. SQL Injection Prevention (unchanged)

Always use Spring Data JPA / parameterised queries:

```java
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    @Query("SELECT p FROM Patient p WHERE p.user.email = :email")
    Optional<Patient> findByEmail(@Param("email") String email);
}
```

Never concatenate user input into SQL strings.

---

## Performance Tuning

### 1. Connection Pooling (HikariCP — unchanged)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 2. Hibernate Second-Level Cache (unchanged shape)

```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

### 3. Query Optimisation — Batch Processing (unchanged)

```java
@Transactional
public void insertAppointments(List<Appointment> appointments) {
    int batchSize = 20;
    for (int i = 0; i < appointments.size(); i++) {
        entityManager.persist(appointments.get(i));
        if ((i + 1) % batchSize == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }
}
```

### 4. Statistics & Index Maintenance (PostgreSQL)

```sql
-- Refresh planner statistics (replaces DBMS_STATS.GATHER_*)
ANALYZE appointments;
ANALYZE medical_records;
ANALYZE;                              -- whole database

-- Online index rebuild (replaces ALTER INDEX ... REBUILD)
REINDEX INDEX CONCURRENTLY idx_appointments_patient_id;
REINDEX TABLE  CONCURRENTLY appointments;

-- Bloat & vacuum diagnostics
VACUUM (ANALYZE, VERBOSE) appointments;
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;
```

In production, configure `autovacuum_vacuum_scale_factor` and
`autovacuum_analyze_scale_factor` tighter on the busiest tables
(`audit_logs`, `appointments`, `medical_records`).

### 5. JSONB Indexing (when traffic warrants it)

```sql
CREATE INDEX idx_med_records_vital_signs_gin ON medical_records USING GIN (vital_signs);
CREATE INDEX idx_audit_logs_new_values_gin   ON audit_logs       USING GIN (new_values);
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests against a disposable PostgreSQL container passing
- [ ] Code review completed
- [ ] OWASP / dependency-check scan clean
- [ ] Load test against expected peak (k6 or JMeter)
- [ ] Backup strategy documented (`pg_dump --format=custom` + WAL archiving)
- [ ] Disaster recovery drill executed

### Database Deployment

- [ ] Schema (`medtech_schema_pg.sql`) applied and validated
- [ ] All 13 ENUMs, 9 base tables, 3 views, ~71 indexes present
- [ ] Audit triggers verified by inserting a test row
- [ ] Seed data loaded for non-production environments only
- [ ] HikariCP pool sized for instance
- [ ] Nightly `pg_dump` cron + offsite copy
- [ ] Monitoring (Prometheus `postgres_exporter`, Grafana dashboards)

### Application Deployment

- [ ] Environment variables (DB URL, JWT secret, mail) injected via vault
- [ ] TLS certificates installed (server + database)
- [ ] CORS allow-list pinned to production origins
- [ ] Centralised logging (ELK / Loki) wired
- [ ] OpenAPI / Swagger documentation published
- [ ] `/actuator/health`, `/actuator/info` reachable

### Post-Deployment

- [ ] CPU, memory, disk, WAL volume monitored
- [ ] Application logs scrubbed of errors
- [ ] Smoke-test critical clinical flows (book → consult → prescribe)
- [ ] Audit trail verified end-to-end
- [ ] Backup restoration drill scheduled within 30 days
- [ ] Post-mortem / lessons-learned filed

---

## Troubleshooting

### Docker / Container Issues

**Container won't start**
```bash
docker compose -f docker/docker-compose.yml logs postgres
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

**`bind: address already in use` on 5432**
A native PostgreSQL is already running on the host. Either stop it
(`brew services stop postgresql@16`, or `sudo launchctl unload …`) or map
the container to another port (this guide uses `5433:5432`).

**Init script didn't run**
The init scripts in `/docker-entrypoint-initdb.d/` execute **only when the
data volume is empty**. To re-init:
```bash
docker compose -f docker/docker-compose.yml down -v   # wipes postgres_data
docker compose -f docker/docker-compose.yml up -d
```

### Database Connection Issues

**`FATAL: password authentication failed for user "medtech_app"`**
Volume contains an old cluster initialised with a different password.
Drop the volume (`down -v`) and restart.

**`could not translate host name "postgres" to address`**
You are connecting from outside the Docker network. Use `localhost:5433`
from the host, or run your service on the `medtech-network`.

**`relation "users" does not exist`**
The init script didn't run because the volume already had data, or the
bind-mount path is wrong. Confirm with:
```bash
docker exec medtech-postgres ls /docker-entrypoint-initdb.d/
```

### pgAdmin Issues

**Cannot reach `postgres:5432` from pgAdmin**
Both containers must be on `medtech-network`. The compose file already
enforces this; verify with `docker network inspect docker_medtech-network`.

---

## Support & Resources

- **PostgreSQL 16 documentation**: https://www.postgresql.org/docs/16/
- **pgAdmin 4 documentation**: https://www.pgadmin.org/docs/
- **Spring Boot + PostgreSQL guide**: https://spring.io/guides/gs/accessing-data-jpa/
- **Hibernate dialects**: https://docs.jboss.org/hibernate/orm/6.4/dialect/dialect.html
- **Macedonian Healthcare Standards**: Ministry of Health — Republic of North Macedonia

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| 1.0     | 2026-05-16 | Initial release on Oracle 21c |
| 2.0     | 2026-05-16 | **Migrated to PostgreSQL 16.** ENUM types replace CHECK constraints; `JSONB` for vital signs & audit payloads; identity columns replace sequences; PL/SQL triggers rewritten as `plpgsql`; pgAdmin 4 replaces SQL Developer / OEM; HikariCP, BCrypt, JWT, CORS sections preserved verbatim. |

---

**Last Updated:** May 16, 2026
**Maintained By:** MedTech Platform Engineering
**Status:** Production Ready (PostgreSQL 16)
