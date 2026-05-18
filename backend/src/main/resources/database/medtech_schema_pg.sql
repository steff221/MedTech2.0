-- ============================================================================
-- MedTech Medical Administration System - PostgreSQL Database Schema
-- Enterprise-grade implementation with audit trails, constraints, and indexing
-- Version: 2.0
-- Migrated: 2026 (from Oracle 21c)
-- Database: PostgreSQL 16+
-- ============================================================================

-- ============================================================================
-- PART 1: ENUM TYPES (replace Oracle CHECK constraints)
-- ============================================================================
CREATE TYPE user_role_enum         AS ENUM ('PATIENT', 'DOCTOR', 'NURSE');
CREATE TYPE user_status_enum       AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE gender_enum            AS ENUM ('M', 'F', 'O');
CREATE TYPE blood_type_enum        AS ENUM ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');
CREATE TYPE hospital_type_enum     AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY', 'PRIVATE', 'CLINIC');
CREATE TYPE hospital_status_enum   AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE appointment_status_enum AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
CREATE TYPE appointment_type_enum  AS ENUM ('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'CHECKUP');
CREATE TYPE prescription_route_enum AS ENUM ('ORAL', 'INJECTION', 'TOPICAL', 'INHALED', 'IV', 'IM', 'SC');
CREATE TYPE prescription_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE operation_status_enum  AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE audit_action_enum      AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT');
CREATE TYPE audit_status_enum      AS ENUM ('SUCCESS', 'FAILURE');

-- ============================================================================
-- PART 2: CORE DOMAIN TABLES
-- ============================================================================

-- USERS ----------------------------------------------------------------------
CREATE TABLE users (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone_number        VARCHAR(20),
    role                user_role_enum NOT NULL,
    status              user_status_enum NOT NULL DEFAULT 'ACTIVE',
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    last_login          TIMESTAMPTZ,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    created_by          VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(100),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PATIENTS -------------------------------------------------------------------
CREATE TABLE patients (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    date_of_birth       DATE NOT NULL,
    gender              gender_enum,
    blood_type          blood_type_enum,
    allergies           TEXT,
    chronic_conditions  TEXT,
    insurance_provider  VARCHAR(255),
    insurance_number    VARCHAR(100),
    emergency_contact   VARCHAR(255),
    emergency_phone     VARCHAR(20),
    address             VARCHAR(500),
    city                VARCHAR(100),
    postal_code         VARCHAR(20),
    country             VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_patients_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- HOSPITALS ------------------------------------------------------------------
CREATE TABLE hospitals (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                VARCHAR(255) NOT NULL UNIQUE,
    city                VARCHAR(100) NOT NULL,
    address             VARCHAR(500) NOT NULL,
    postal_code         VARCHAR(20),
    phone_number        VARCHAR(20),
    latitude            NUMERIC(10, 8),
    longitude           NUMERIC(11, 8),
    type                hospital_type_enum,
    director_name       VARCHAR(255),
    bed_count           INTEGER,
    status              hospital_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOCTORS --------------------------------------------------------------------
CREATE TABLE doctors (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    hospital_id         BIGINT NOT NULL,
    license_number      VARCHAR(100) NOT NULL UNIQUE,
    specialization      VARCHAR(255) NOT NULL,
    sub_specialization  VARCHAR(255),
    qualification       VARCHAR(500),
    experience_years    INTEGER,
    office_number       VARCHAR(50),
    consultation_fee    NUMERIC(10, 2),
    availability_hours  VARCHAR(255),
    bio                 TEXT,
    status              user_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doctors_users     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_doctors_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- APPOINTMENTS ---------------------------------------------------------------
CREATE TABLE appointments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    hospital_id         BIGINT NOT NULL,
    appointment_date    DATE NOT NULL,
    appointment_time    VARCHAR(10) NOT NULL,
    duration_minutes    INTEGER NOT NULL DEFAULT 30,
    status              appointment_status_enum NOT NULL DEFAULT 'SCHEDULED',
    appointment_type    appointment_type_enum,
    reason              VARCHAR(500),
    notes               TEXT,
    cancelled_by        VARCHAR(100),
    cancellation_reason VARCHAR(500),
    created_by          VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(100),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_appointments_patients  FOREIGN KEY (patient_id)  REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_doctors   FOREIGN KEY (doctor_id)   REFERENCES doctors(id),
    CONSTRAINT fk_appointments_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
-- Note: Oracle's CHECK (appointment_date > TRUNC(SYSDATE)) used SYSDATE which is
-- not IMMUTABLE; in PostgreSQL such temporal validation belongs in application
-- logic or a BEFORE INSERT trigger, not a CHECK constraint.

-- MEDICAL_RECORDS ------------------------------------------------------------
CREATE TABLE medical_records (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    hospital_id         BIGINT NOT NULL,
    appointment_id      BIGINT,
    diagnosis           VARCHAR(500),
    mkb10_code          VARCHAR(20),
    clinical_notes      TEXT NOT NULL,
    vital_signs         JSONB,
    blood_pressure      VARCHAR(20),
    heart_rate          INTEGER,
    temperature         NUMERIC(5, 2),
    weight              NUMERIC(5, 2),
    height              NUMERIC(5, 2),
    bmi                 NUMERIC(5, 2),
    assessment          TEXT,
    plan                TEXT,
    is_confidential     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(100),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_med_records_patients     FOREIGN KEY (patient_id)     REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_med_records_doctors      FOREIGN KEY (doctor_id)      REFERENCES doctors(id),
    CONSTRAINT fk_med_records_hospitals    FOREIGN KEY (hospital_id)    REFERENCES hospitals(id),
    CONSTRAINT fk_med_records_appointments FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- PRESCRIPTIONS --------------------------------------------------------------
CREATE TABLE prescriptions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    medical_record_id   BIGINT,
    medication_name     VARCHAR(255) NOT NULL,
    dosage              VARCHAR(100) NOT NULL,
    frequency           VARCHAR(100) NOT NULL,
    duration_days       INTEGER,
    quantity            INTEGER,
    route               prescription_route_enum,
    instructions        TEXT,
    start_date          DATE NOT NULL,
    end_date            DATE,
    status              prescription_status_enum NOT NULL DEFAULT 'ACTIVE',
    filled_at_pharmacy  DATE,
    pharmacy_name       VARCHAR(255),
    refills_allowed     INTEGER NOT NULL DEFAULT 0,
    refills_used        INTEGER NOT NULL DEFAULT 0,
    created_by          VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(100),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_prescriptions_patients    FOREIGN KEY (patient_id)        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_doctors     FOREIGN KEY (doctor_id)         REFERENCES doctors(id),
    CONSTRAINT fk_prescriptions_med_records FOREIGN KEY (medical_record_id) REFERENCES medical_records(id),
    CONSTRAINT chk_prescription_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- OPERATIONS -----------------------------------------------------------------
CREATE TABLE operations (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id            BIGINT NOT NULL,
    doctor_id             BIGINT NOT NULL,
    hospital_id           BIGINT NOT NULL,
    operation_name        VARCHAR(255) NOT NULL,
    operation_date        DATE NOT NULL,
    operation_time        VARCHAR(10),
    duration_minutes      INTEGER,
    operation_room        VARCHAR(50),
    surgical_team         VARCHAR(500),
    anesthesia_type       VARCHAR(100),
    anesthesiologist      VARCHAR(255),
    pre_operative_notes   TEXT,
    intra_operative_notes TEXT,
    post_operative_notes  TEXT,
    complications         VARCHAR(500),
    outcome               VARCHAR(500),
    status                operation_status_enum NOT NULL DEFAULT 'SCHEDULED',
    implants_used         TEXT,
    created_by            VARCHAR(100),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by            VARCHAR(100),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_operations_patients  FOREIGN KEY (patient_id)  REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_operations_doctors   FOREIGN KEY (doctor_id)   REFERENCES doctors(id),
    CONSTRAINT fk_operations_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- AUDIT_LOGS -----------------------------------------------------------------
CREATE TABLE audit_logs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT,
    action_type         audit_action_enum NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           BIGINT,
    old_values          JSONB,
    new_values          JSONB,
    description         VARCHAR(500),
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(500),
    status              audit_status_enum,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_logs_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: INDEXES (performance optimization)
-- ============================================================================

-- Users
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_status     ON users(status);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Patients
CREATE INDEX idx_patients_user_id    ON patients(user_id);
CREATE INDEX idx_patients_city       ON patients(city);
CREATE INDEX idx_patients_blood_type ON patients(blood_type);
CREATE INDEX idx_patients_dob        ON patients(date_of_birth);
CREATE INDEX idx_patients_location   ON patients(city, postal_code);

-- Doctors
CREATE INDEX idx_doctors_user_id        ON doctors(user_id);
CREATE INDEX idx_doctors_hospital_id    ON doctors(hospital_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_status         ON doctors(status);
CREATE INDEX idx_doctors_license        ON doctors(license_number);
CREATE INDEX idx_doctors_hospital_spec  ON doctors(hospital_id, specialization);
CREATE INDEX idx_doctors_spec_status    ON doctors(specialization, status);

-- Hospitals
CREATE INDEX idx_hospitals_city      ON hospitals(city);
CREATE INDEX idx_hospitals_type      ON hospitals(type);
CREATE INDEX idx_hospitals_status    ON hospitals(status);
CREATE INDEX idx_hospitals_city_type ON hospitals(city, type);

-- Appointments
CREATE INDEX idx_appointments_patient_id   ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id    ON appointments(doctor_id);
CREATE INDEX idx_appointments_hospital_id  ON appointments(hospital_id);
CREATE INDEX idx_appointments_date         ON appointments(appointment_date DESC);
CREATE INDEX idx_appointments_status       ON appointments(status);
CREATE INDEX idx_appointments_doctor_date  ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date DESC);
CREATE INDEX idx_appointments_date_status  ON appointments(appointment_date, status);
CREATE INDEX idx_appointments_lookup       ON appointments(patient_id, doctor_id, appointment_date);

-- Medical Records
CREATE INDEX idx_med_records_patient_id     ON medical_records(patient_id);
CREATE INDEX idx_med_records_doctor_id      ON medical_records(doctor_id);
CREATE INDEX idx_med_records_hospital_id    ON medical_records(hospital_id);
CREATE INDEX idx_med_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX idx_med_records_mkb10          ON medical_records(mkb10_code);
CREATE INDEX idx_med_records_created_at     ON medical_records(created_at DESC);
CREATE INDEX idx_med_records_patient_date   ON medical_records(patient_id, created_at DESC);
CREATE INDEX idx_med_records_diagnosis      ON medical_records(patient_id, mkb10_code);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient_id      ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id       ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_med_record_id   ON prescriptions(medical_record_id);
CREATE INDEX idx_prescriptions_status          ON prescriptions(status);
CREATE INDEX idx_prescriptions_start_date      ON prescriptions(start_date DESC);
CREATE INDEX idx_prescriptions_patient_status  ON prescriptions(patient_id, status);
CREATE INDEX idx_prescriptions_patient_date    ON prescriptions(patient_id, start_date DESC);

-- Operations
CREATE INDEX idx_operations_patient_id   ON operations(patient_id);
CREATE INDEX idx_operations_doctor_id    ON operations(doctor_id);
CREATE INDEX idx_operations_hospital_id  ON operations(hospital_id);
CREATE INDEX idx_operations_date         ON operations(operation_date DESC);
CREATE INDEX idx_operations_status       ON operations(status);
CREATE INDEX idx_operations_patient_date ON operations(patient_id, operation_date DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id       ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type   ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type   ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_user_date     ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity_action ON audit_logs(entity_type, action_type, created_at DESC);

-- ============================================================================
-- PART 4: VIEWS (simplified data access patterns)
-- ============================================================================

CREATE OR REPLACE VIEW vw_patient_appointments AS
SELECT
    a.id,
    a.patient_id,
    p.user_id                                                 AS patient_user_id,
    u_patient.first_name || ' ' || u_patient.last_name        AS patient_name,
    a.doctor_id,
    d.specialization,
    u_doctor.first_name  || ' ' || u_doctor.last_name         AS doctor_name,
    h.name                                                    AS hospital_name,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.created_at
FROM appointments a
JOIN patients  p         ON a.patient_id  = p.id
JOIN users     u_patient ON p.user_id     = u_patient.id
JOIN doctors   d         ON a.doctor_id   = d.id
JOIN users     u_doctor  ON d.user_id     = u_doctor.id
JOIN hospitals h         ON a.hospital_id = h.id;

CREATE OR REPLACE VIEW vw_doctor_schedule AS
SELECT
    d.id                                            AS doctor_id,
    u.first_name || ' ' || u.last_name              AS doctor_name,
    d.specialization,
    h.name                                          AS hospital_name,
    a.appointment_date,
    a.appointment_time,
    COUNT(*) OVER (PARTITION BY d.id, a.appointment_date) AS appointments_today,
    a.status
FROM doctors d
JOIN users     u ON d.user_id     = u.id
JOIN hospitals h ON d.hospital_id = h.id
LEFT JOIN appointments a ON d.id = a.doctor_id
WHERE d.status = 'ACTIVE' AND u.status = 'ACTIVE';

CREATE OR REPLACE VIEW vw_patient_medical_history AS
SELECT
    mr.id,
    p.id                                              AS patient_id,
    u.first_name     || ' ' || u.last_name            AS patient_name,
    d.specialization,
    u_doc.first_name || ' ' || u_doc.last_name        AS doctor_name,
    mr.diagnosis,
    mr.mkb10_code,
    mr.created_at                                     AS visit_date,
    mr.is_confidential
FROM medical_records mr
JOIN patients p     ON mr.patient_id = p.id
JOIN users    u     ON p.user_id     = u.id
JOIN doctors  d     ON mr.doctor_id  = d.id
JOIN users    u_doc ON d.user_id     = u_doc.id;
-- ORDER BY removed (invalid in PostgreSQL view definitions)

-- ============================================================================
-- PART 5: TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Generic updated_at maintenance ---------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_operations_updated_at
    BEFORE UPDATE ON operations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Users audit ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_users_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_values)
        VALUES (NEW.id, 'INSERT', 'USERS', NEW.id,
                jsonb_build_object('email', NEW.email, 'role', NEW.role));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.password_hash IS DISTINCT FROM NEW.password_hash
           OR OLD.status        IS DISTINCT FROM NEW.status THEN
            INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, old_values, new_values)
            VALUES (NEW.id, 'UPDATE', 'USERS', NEW.id,
                    jsonb_build_object('status', OLD.status,
                                       'password_changed', OLD.password_hash IS DISTINCT FROM NEW.password_hash),
                    jsonb_build_object('status', NEW.status,
                                       'password_changed', OLD.password_hash IS DISTINCT FROM NEW.password_hash));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_audit
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_users_audit();

-- Appointments audit ---------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_appointments_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, new_values)
        VALUES ('INSERT', 'APPOINTMENTS', NEW.id,
                jsonb_build_object('patient_id', NEW.patient_id,
                                   'doctor_id',  NEW.doctor_id,
                                   'date',       NEW.appointment_date));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, old_values, new_values)
        VALUES ('UPDATE', 'APPOINTMENTS', NEW.id,
                jsonb_build_object('status', OLD.status),
                jsonb_build_object('status', NEW.status));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, old_values)
        VALUES ('DELETE', 'APPOINTMENTS', OLD.id,
                jsonb_build_object('patient_id', OLD.patient_id,
                                   'date',       OLD.appointment_date));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_audit
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION fn_appointments_audit();

-- Prescriptions audit --------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prescriptions_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, new_values)
        VALUES ('INSERT', 'PRESCRIPTIONS', NEW.id,
                jsonb_build_object('medication', NEW.medication_name,
                                   'patient_id', NEW.patient_id));
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, old_values, new_values)
        VALUES ('UPDATE', 'PRESCRIPTIONS', NEW.id,
                jsonb_build_object('status', OLD.status),
                jsonb_build_object('status', NEW.status));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prescriptions_audit
    AFTER INSERT OR UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION fn_prescriptions_audit();

-- ============================================================================
-- PART 6: SEED DATA (Macedonian context)
-- ============================================================================

-- Hospitals ------------------------------------------------------------------
INSERT INTO hospitals (name, city, address, postal_code, phone_number, latitude, longitude, type, director_name, bed_count, status) VALUES
('Клиничка болница Тетово', 'Тетово',  'ул. Болнична 1',     '1200', '+389 49 123 456', 41.9940, 20.9740, 'PRIMARY',   'Д-р Иван Петров',           200, 'ACTIVE'),
('Универзитетска клиника',  'Скопје',  'ул. Водњанска 17',   '1000', '+389 2 309 3000', 41.9973, 21.4280, 'TERTIARY',  'Проф. Д-р Марко Миланов',   500, 'ACTIVE'),
('Болница Куманово',        'Куманово','ул. Болнична 50',    '1300', '+389 31 245 123', 42.1327, 21.7156, 'SECONDARY', 'Д-р Александар Стојев',     150, 'ACTIVE');

-- Doctor (user + doctor in one CTE) -----------------------------------------
WITH new_user AS (
    INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
    VALUES ('dr.petrov@medtech.mk',
            '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO',
            'Иван', 'Петров', '+389 70 234 567',
            'DOCTOR', 'ACTIVE', TRUE, 'SYSTEM')
    RETURNING id
)
INSERT INTO doctors (user_id, hospital_id, license_number, specialization, sub_specialization,
                     qualification, experience_years, office_number, consultation_fee,
                     availability_hours, bio, status)
SELECT new_user.id,
       (SELECT id FROM hospitals WHERE name = 'Клиничка болница Тетово'),
       'LIC-MK-001', 'Кардиологија', 'Интервенциона кардиологија',
       'MD, PhD Cardiology University of Skopje', 15, '301', 100.00,
       '08:00-16:00', 'Специјалист по болести на срцето', 'ACTIVE'
FROM new_user;

-- Patient (user + patient in one CTE) ---------------------------------------
WITH new_user AS (
    INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
    VALUES ('patient1@medtech.mk',
            '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO',
            'Мирна', 'Стефановска', '+389 70 111 222',
            'PATIENT', 'ACTIVE', TRUE, 'SYSTEM')
    RETURNING id
)
INSERT INTO patients (user_id, date_of_birth, gender, blood_type, allergies, chronic_conditions,
                      insurance_provider, insurance_number, emergency_contact, emergency_phone,
                      address, city, postal_code, country)
SELECT new_user.id, DATE '1985-05-15', 'F', 'O+', 'Пеницилин', 'Хипертензија',
       'Blue Cross', 'BC-MK-123456', 'Марко Стефановски', '+389 75 555 666',
       'Ул. Гоце Делчев 45', 'Тетово', '1200', 'Македонија'
FROM new_user;

-- ============================================================================
-- PART 7: STATISTICS (PostgreSQL planner)
-- ============================================================================
ANALYZE;

-- ============================================================================
-- VERIFICATION QUERIES (run manually)
-- ============================================================================
-- SELECT COUNT(*) FROM information_schema.tables   WHERE table_schema = 'public';
-- SELECT COUNT(*) FROM pg_indexes                  WHERE schemaname   = 'public';
-- SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
-- SELECT typname FROM pg_type WHERE typcategory = 'E';
