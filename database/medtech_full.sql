-- ============================================================================
-- MedTech 2.0 — Self-contained PostgreSQL database (schema + demo data)
-- Open this file in DataGrip. Run it against any PostgreSQL 16+ server to get
-- the full database. See README.md in this folder for the 2-click DataGrip way.
-- All demo users share the password: magii1002
-- ============================================================================

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
CREATE TYPE user_role_enum         AS ENUM ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'GENERAL_PRACTITIONER');
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

ANALYZE;


BEGIN;

INSERT INTO hospitals (name, city, address, postal_code, phone_number, latitude, longitude, type, director_name, bed_count, status)
SELECT * FROM (VALUES
  ('Општа болница Битола',     'Битола',   'ул. Партизанска бб',     '7000', '+389 47 200 000', 41.02970::numeric, 21.32940::numeric, 'SECONDARY'::hospital_type_enum, 'Драган Илиевски',  280, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Охрид',      'Охрид',    'ул. Сирма Војвода 73',   '6000', '+389 46 200 000', 41.11720::numeric, 20.80140::numeric, 'SECONDARY'::hospital_type_enum, 'Игор Спасески',    220, 'ACTIVE'::hospital_status_enum),
  ('Клиничка болница Штип',    'Штип',     'ул. Тошо Арсов бб',      '2000', '+389 32 200 000', 41.74610::numeric, 22.19720::numeric, 'TERTIARY'::hospital_type_enum,  'Зоран Ѓоргиев',    310, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Прилеп',     'Прилеп',   'ул. 11 Октомври бб',     '7500', '+389 48 200 000', 41.34640::numeric, 21.55440::numeric, 'SECONDARY'::hospital_type_enum, 'Маја Петковска',   200, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Струмица',   'Струмица', 'ул. Млечен Пат бб',      '2400', '+389 34 200 000', 41.43780::numeric, 22.64110::numeric, 'SECONDARY'::hospital_type_enum, 'Никола Атанасов',  180, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Гостивар',   'Гостивар', 'ул. Браќа Гиноски бб',   '1230', '+389 42 200 000', 41.79720::numeric, 20.90280::numeric, 'SECONDARY'::hospital_type_enum, 'Ариф Незири',      160, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Велес',      'Велес',    'ул. Шефки Сали бб',      '1400', '+389 43 200 000', 41.71560::numeric, 21.77580::numeric, 'SECONDARY'::hospital_type_enum, 'Љубомир Андонов',  170, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Кичево',     'Кичево',    'ул. Маршал Тито бб',        '6250', '+389 45 220 000', 41.51300::numeric, 20.95800::numeric, 'SECONDARY'::hospital_type_enum, 'Билјана Трајкоска',  120, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Кавадарци',  'Кавадарци', 'ул. Маршал Тито бб',        '1430', '+389 43 410 000', 41.43340::numeric, 22.01220::numeric, 'SECONDARY'::hospital_type_enum, 'Томе Јовановски',   140, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Гевгелија',  'Гевгелија', 'ул. Маршал Тито бб',        '1480', '+389 34 210 000', 41.14380::numeric, 22.50540::numeric, 'SECONDARY'::hospital_type_enum, 'Горан Стоилов',     110, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Кочани',     'Кочани',    'ул. Партизански одред бб',  '2300', '+389 33 270 000', 41.91430::numeric, 22.41260::numeric, 'SECONDARY'::hospital_type_enum, 'Снежана Георгиева',  130, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Дебар',      'Дебар',     'ул. Сливово бб',            '1250', '+389 46 830 000', 41.52390::numeric, 20.52440::numeric, 'SECONDARY'::hospital_type_enum, 'Хасан Реџепи',      100, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Неготино',   'Неготино',  'ул. Моша Пијаде бб',        '1440', '+389 43 360 000', 41.48370::numeric, 22.08940::numeric, 'SECONDARY'::hospital_type_enum, 'Ленче Јовановска',   90, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Свети Николе','Свети Николе','ул. Трајко Христов бб',  '2220', '+389 32 440 000', 41.86690::numeric, 21.94370::numeric, 'SECONDARY'::hospital_type_enum, 'Димитар Стојков',    80, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Берово',     'Берово',    'ул. Маршал Тито бб',        '2330', '+389 33 470 000', 41.70970::numeric, 22.85410::numeric, 'SECONDARY'::hospital_type_enum, 'Роза Митева',        75, 'ACTIVE'::hospital_status_enum)
) AS v(name, city, address, postal_code, phone_number, latitude, longitude, type, director_name, bed_count, status)
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE hospitals.name = v.name);



WITH new_doctors AS (
  SELECT * FROM (VALUES
    ('dr.markovska@medtech.mk', 'Ана',     'Марковска',  'DR-0101', 'Dermatology',     'Skin Biopsy, Cryotherapy, Mole Removal, Laser Therapy, Acne Treatment',                'Универзитетска клиника',     14, 1800::numeric),
    ('dr.todorov@medtech.mk',   'Бојан',   'Тодоров',    'DR-0102', 'Family Medicine', 'Annual Physical, Vaccinations, Health Screening, Wellness Check, Minor Injuries',     'Општа болница Битола',        9, 1200::numeric),
    ('dr.nikolov@medtech.mk',   'Стефан',  'Николов',    'DR-0103', 'Neurology',       'EEG, EMG, Lumbar Puncture, Nerve Conduction Study, Migraine Therapy',                 'Клиничка болница Штип',      18, 2200::numeric),
    ('dr.spasevska@medtech.mk', 'Маја',    'Спасевска',  'DR-0104', 'Pediatrics',      'Well-Child Visit, Immunizations, Developmental Screening, Pediatric Allergy',        'Општа болница Охрид',        11, 1500::numeric),
    ('dr.angelov@medtech.mk',   'Игор',    'Ангелов',    'DR-0105', 'Orthopedics',     'X-ray, MRI, Joint Injection, Casting, Physical Therapy, Sports Medicine',            'Општа болница Прилеп',       16, 2000::numeric),
    ('dr.ristova@medtech.mk',   'Елена',   'Ристова',    'DR-0106', 'Gynecology',      'Pap Smear, Mammogram, Ultrasound, Colposcopy, Prenatal Care',                         'Универзитетска клиника',     13, 1900::numeric)
  ) AS v(email, first_name, last_name, license_number, specialization, procedures, hospital_name, exp_years, fee)
),
inserted_users AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  SELECT email, '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
         first_name, last_name, '+389 70 000 000', 'DOCTOR'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED'
  FROM new_doctors
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = new_doctors.email)
  RETURNING id, email
)
INSERT INTO doctors (user_id, hospital_id, license_number, specialization, sub_specialization, experience_years, consultation_fee, bio, status)
SELECT iu.id, h.id, nd.license_number, nd.specialization, nd.procedures, nd.exp_years, nd.fee,
       'Board-certified ' || nd.specialization || ' specialist with ' || nd.exp_years || ' years of clinical experience.',
       'ACTIVE'::user_status_enum
FROM new_doctors nd
JOIN inserted_users iu ON iu.email = nd.email
JOIN hospitals h ON h.name = nd.hospital_name
WHERE NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = iu.id);

UPDATE doctors
SET sub_specialization = 'ECG, Echocardiogram, Stress Test, Holter Monitor, Cardiac Catheterization',
    bio = COALESCE(NULLIF(bio, ''), 'Board-certified Cardiology specialist.')
WHERE license_number IN ('LIC-MK-001', 'DR-0042') AND (sub_specialization IS NULL OR sub_specialization = '');

WITH new_patients AS (
  SELECT * FROM (VALUES
    ('patient@medtech.mk',       'Петар',     'Костадинов',   'M', '1988-03-12', 'O+',  'Скопје',    'ул. Партизанска 25'),
    ('a.dimitrova@medtech.mk',   'Анастасија','Димитрова',   'F', '1992-07-08', 'A+',  'Битола',    'ул. Маршал Тито 47'),
    ('m.jovanovski@medtech.mk',  'Марко',     'Јовановски',   'M', '1975-11-23', 'B+',  'Охрид',     'ул. Гоце Делчев 12'),
    ('s.bogdanova@medtech.mk',   'Сара',      'Богданова',    'F', '2001-01-30', 'AB+', 'Тетово',    'ул. Илинденска 88'),
    ('d.gjorgiev@medtech.mk',    'Дамјан',    'Ѓоргиев',      'M', '1969-09-04', 'O-',  'Штип',      'ул. Васил Главинов 5'),
    ('n.angelovska@medtech.mk',  'Наташа',    'Ангеловска',   'F', '1995-12-19', 'A-',  'Прилеп',    'ул. Прилепска 33'),
    ('v.stojkovski@medtech.mk',  'Виктор',    'Стојковски',   'M', '1983-06-14', 'B-',  'Куманово',  'ул. Народна Војска 17'),
    ('k.todorovska@medtech.mk',  'Катерина',  'Тодоровска',   'F', '1978-04-27', 'O+',  'Скопје',    'ул. Македонија 200'),
    ('z.petrovski@medtech.mk',   'Здравко',   'Петровски',    'M', '1955-08-02', 'AB-', 'Гостивар',  'ул. Браќа Миладиновци 9'),
    ('l.iliev@medtech.mk',       'Лазар',     'Илиев',        'M', '2010-02-17', 'O+',  'Велес',     'ул. Алексо Демниевски 4'),
    ('e.naumova@medtech.mk',     'Емилија',   'Наумова',      'F', '1998-10-25', 'A+',  'Струмица',  'ул. Сандо Масев 21')
  ) AS v(email, first_name, last_name, gender, dob, blood_type, city, address)
),
inserted_users AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  SELECT email, '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
         first_name, last_name, '+389 71 ' || lpad((row_number() OVER ())::int::text, 6, '0'),
         'PATIENT'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED'
  FROM new_patients
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = new_patients.email)
  RETURNING id, email
)
INSERT INTO patients (user_id, date_of_birth, gender, blood_type, allergies, city, address, country)
SELECT iu.id, np.dob::date, np.gender::gender_enum, np.blood_type::blood_type_enum,
       CASE (np.first_name LIKE 'A%')::int WHEN 1 THEN 'Penicillin' ELSE 'None known' END,
       np.city, np.address, 'North Macedonia'
FROM new_patients np
JOIN inserted_users iu ON iu.email = np.email
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id = iu.id);

ALTER TABLE appointments DISABLE TRIGGER ALL;
-- Generate a deterministic-ish spread using row_number() against the cross product.
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, duration_minutes, status, appointment_type, reason, created_by)
SELECT
  p.id,
  d.id,
  d.hospital_id,
  CURRENT_DATE + ((row_number() OVER ())::int % 21 - 10) AS appointment_date,
  -- Slot times across the working day, deterministic per row
  CASE (row_number() OVER ())::int % 8
    WHEN 0 THEN '09:00'::time WHEN 1 THEN '09:40'::time WHEN 2 THEN '10:20'::time
    WHEN 3 THEN '11:00'::time WHEN 4 THEN '11:40'::time WHEN 5 THEN '13:00'::time
    WHEN 6 THEN '14:20'::time ELSE '15:00'::time
  END AS appointment_time,
  CASE (row_number() OVER ())::int % 4 WHEN 0 THEN 20 WHEN 1 THEN 30 WHEN 2 THEN 30 ELSE 45 END,
  CASE
    WHEN ((row_number() OVER ())::int % 21 - 10) < -2 THEN 'COMPLETED'::appointment_status_enum
    WHEN ((row_number() OVER ())::int % 21 - 10) = -2 THEN 'NO_SHOW'::appointment_status_enum
    WHEN ((row_number() OVER ())::int % 11) = 0     THEN 'CANCELLED'::appointment_status_enum
    ELSE 'SCHEDULED'::appointment_status_enum
  END,
  (ARRAY['CONSULTATION', 'FOLLOW_UP', 'CHECKUP', 'PROCEDURE'])[1 + (row_number() OVER ())::int % 4]::appointment_type_enum,
  (ARRAY[
    'Routine checkup', 'Persistent headache', 'Follow-up on lab results',
    'Annual physical', 'Back pain', 'Skin rash evaluation',
    'Pediatric vaccination', 'Heart palpitations', 'Joint pain assessment',
    'Pre-operative consultation'
  ])[1 + (row_number() OVER ())::int % 10],
  'MOCK_SEED'
FROM (SELECT id, hospital_id FROM doctors ORDER BY id LIMIT 8) d
CROSS JOIN (SELECT id FROM patients ORDER BY id LIMIT 6) p
LIMIT 40;
ALTER TABLE appointments ENABLE TRIGGER ALL;

INSERT INTO medical_records (patient_id, doctor_id, hospital_id, appointment_id, diagnosis, mkb10_code, clinical_notes, blood_pressure, heart_rate, temperature, weight, height, assessment, plan, created_by)
SELECT
  a.patient_id, a.doctor_id, a.hospital_id, a.id,
  (ARRAY['Essential hypertension', 'Type 2 diabetes mellitus', 'Acute upper respiratory infection',
         'Migraine without aura', 'Atopic dermatitis', 'Lower back pain (unspecified)',
         'Iron-deficiency anaemia', 'Generalized anxiety disorder', 'Seasonal allergic rhinitis',
         'Gastro-oesophageal reflux disease'])[1 + (row_number() OVER ())::int % 10],
  (ARRAY['I10', 'E11.9', 'J06.9', 'G43.9', 'L20.9', 'M54.5', 'D50.9', 'F41.1', 'J30.2', 'K21.9'])[1 + (row_number() OVER ())::int % 10],
  'Patient presents with chief complaint. Examination unremarkable except for relevant findings. Reassurance provided; follow-up scheduled.',
  (ARRAY['120/80', '135/85', '118/76', '142/90', '125/82'])[1 + (row_number() OVER ())::int % 5],
  68 + ((row_number() OVER ())::int % 15)::int,
  36.4 + (((row_number() OVER ())::int % 8) * 0.1)::numeric(5,2),
  60.0 + (((row_number() OVER ())::int % 35))::numeric(5,2),
  160.0 + (((row_number() OVER ())::int % 30))::numeric(5,2),
  'Stable. Continue current management.',
  'Lifestyle counselling. Lab work in 3 months. Return PRN.',
  'MOCK_SEED'
FROM (
  SELECT id, patient_id, doctor_id, hospital_id
  FROM appointments
  WHERE status = 'COMPLETED' AND created_by = 'MOCK_SEED'
  ORDER BY appointment_date DESC
  LIMIT 15
) a
WHERE NOT EXISTS (SELECT 1 FROM medical_records m WHERE m.appointment_id = a.id);

-- -----------------------------------------------------------------------------
-- 6. Mock prescriptions (~20)
-- -----------------------------------------------------------------------------
INSERT INTO prescriptions (patient_id, doctor_id, medical_record_id, medication_name, dosage, frequency, duration_days, quantity, route, instructions, start_date, end_date, status, created_by)
SELECT
  mr.patient_id, mr.doctor_id, mr.id,
  (ARRAY['Amlodipine', 'Metformin', 'Amoxicillin', 'Sumatriptan', 'Hydrocortisone',
         'Ibuprofen', 'Ferrous sulfate', 'Sertraline', 'Loratadine', 'Pantoprazole',
         'Atorvastatin', 'Lisinopril', 'Salbutamol', 'Ciprofloxacin'])[1 + (row_number() OVER ())::int % 14],
  (ARRAY['5 mg', '10 mg', '500 mg', '50 mg', '1%', '20 mg', '40 mg'])[1 + (row_number() OVER ())::int % 7],
  (ARRAY['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed'])[1 + (row_number() OVER ())::int % 5],
  (ARRAY[7, 14, 30, 60, 90])[1 + (row_number() OVER ())::int % 5],
  (ARRAY[14, 30, 60, 90, 120])[1 + (row_number() OVER ())::int % 5],
  (ARRAY['ORAL','ORAL','ORAL','TOPICAL','INHALED'])[1 + (row_number() OVER ())::int % 5]::prescription_route_enum,
  'Take with food. Complete the course as prescribed.',
  CURRENT_DATE - ((row_number() OVER ())::int % 30),
  CURRENT_DATE - ((row_number() OVER ())::int % 30) + (ARRAY[7, 14, 30, 60, 90])[1 + (row_number() OVER ())::int % 5],
  CASE WHEN (row_number() OVER ())::int % 5 = 0 THEN 'COMPLETED'::prescription_status_enum
       ELSE 'ACTIVE'::prescription_status_enum END,
  'MOCK_SEED'
FROM medical_records mr
WHERE mr.created_by = 'MOCK_SEED'
ORDER BY mr.id
LIMIT 20;

-- Add a few standalone prescriptions (not linked to a medical record)
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration_days, quantity, route, instructions, start_date, end_date, status, created_by)
SELECT
  p.id, d.id,
  (ARRAY['Vitamin D3', 'Omega-3', 'Multivitamin'])[1 + (row_number() OVER ())::int % 3],
  (ARRAY['1000 IU', '1 g', '1 tablet'])[1 + (row_number() OVER ())::int % 3],
  'Once daily',
  90, 90, 'ORAL'::prescription_route_enum,
  'Daily supplement. Take with breakfast.',
  CURRENT_DATE - 14, CURRENT_DATE + 76,
  'ACTIVE'::prescription_status_enum,
  'MOCK_SEED'
FROM (SELECT id FROM patients ORDER BY id LIMIT 5) p
CROSS JOIN (SELECT id FROM doctors ORDER BY id LIMIT 1) d
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Named demo accounts (all use the shared demo password documented at the
--    top of this file — never put real or personal passwords in this file)
-- -----------------------------------------------------------------------------
-- patient@medtech.mk (renamed from p.kostadinov@medtech.mk above)
UPDATE users
SET password_hash = '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
    failed_login_count = 0,
    locked_until = NULL
WHERE email = 'patient@medtech.mk';

-- stefan@medtech.mk (DOCTOR at Универзитетска клиника, Skopje)
WITH u AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  VALUES ('stefan@medtech.mk',
          '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
          'Stefan', 'Perovski', '+389 70 555 000',
          'DOCTOR'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED')
  ON CONFLICT (email) DO UPDATE
    SET password_hash       = EXCLUDED.password_hash,
        failed_login_count  = 0,
        locked_until        = NULL
  RETURNING id, email
)
INSERT INTO doctors (user_id, hospital_id, license_number, specialization, sub_specialization,
                     experience_years, consultation_fee, bio, status)
SELECT u.id,
       (SELECT id FROM hospitals WHERE name = 'Универзитетска клиника' LIMIT 1),
       'DR-STEFAN', 'Internal Medicine',
       'Hypertension, Diabetes Management, Preventive Care, Chronic Disease',
       10, 1500,
       'Board-certified Internal Medicine specialist.',
       'ACTIVE'::user_status_enum
FROM u
WHERE NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id);

-- zoran@medtech.mk (GENERAL_PRACTITIONER at Клиничка болница, Скопје)
WITH u AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  VALUES ('zoran@medtech.mk',
          '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
          'Зоран', 'Николовски', '+389 70 123 456',
          'GENERAL_PRACTITIONER'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED')
  ON CONFLICT (email) DO UPDATE
    SET password_hash      = EXCLUDED.password_hash,
        failed_login_count = 0,
        locked_until       = NULL
  RETURNING id
)
INSERT INTO doctors (user_id, hospital_id, license_number, specialization, sub_specialization,
                     experience_years, consultation_fee, bio, status)
SELECT u.id,
       (SELECT id FROM hospitals ORDER BY id LIMIT 1),
       'DR-ZORAN', 'General Practice',
       'Preventive Care, Chronic Disease Management, Family Medicine',
       8, 800,
       'General practitioner with 8 years of family medicine experience.',
       'ACTIVE'::user_status_enum
FROM u
WHERE NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id);

-- Zoran's calendar — a week of GP appointments so the schedule is never empty.
ALTER TABLE appointments DISABLE TRIGGER ALL;
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time,
                          duration_minutes, status, appointment_type, reason, created_by)
SELECT p.id, z.did, z.hid, t.d, t.t::time, t.dur,
       t.st::appointment_status_enum, t.ty::appointment_type_enum, t.r, 'ZORAN_SEED'
FROM (SELECT id AS did, hospital_id AS hid FROM doctors WHERE license_number = 'DR-ZORAN') z,
     (VALUES
       (1,  CURRENT_DATE,     '08:30', 20, 'SCHEDULED', 'CHECKUP',      'Annual check-up'),
       (2,  CURRENT_DATE,     '09:00', 20, 'SCHEDULED', 'CONSULTATION', 'Flu symptoms'),
       (3,  CURRENT_DATE,     '09:30', 20, 'SCHEDULED', 'FOLLOW_UP',    'Blood pressure recheck'),
       (4,  CURRENT_DATE + 1, '08:30', 20, 'SCHEDULED', 'CHECKUP',      'Diabetes monitoring'),
       (5,  CURRENT_DATE + 1, '09:00', 20, 'SCHEDULED', 'CONSULTATION', 'Back pain'),
       (6,  CURRENT_DATE + 2, '10:00', 20, 'SCHEDULED', 'FOLLOW_UP',    'Cholesterol review'),
       (7,  CURRENT_DATE + 3, '08:30', 20, 'SCHEDULED', 'CHECKUP',      'Routine physical'),
       (2,  CURRENT_DATE - 1, '09:00', 20, 'COMPLETED', 'FOLLOW_UP',    'Post-illness check'),
       (3,  CURRENT_DATE - 2, '08:30', 20, 'COMPLETED', 'CHECKUP',      'Child vaccination')
     ) AS t(rn, d, t, dur, st, ty, r)
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM patients) p ON p.rn = t.rn;
ALTER TABLE appointments ENABLE TRIGGER ALL;

-- nurse@medtech.mk / magii1002  (NURSE — lands on /nurse)
-- Shared hash documented at top of file (magii1002).
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
VALUES
  ('nurse@medtech.mk', '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
   'Ана', 'Стоева', '+389 70 999 002',
   'NURSE'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED')
ON CONFLICT (email) DO UPDATE
  SET password_hash      = EXCLUDED.password_hash,
      role               = EXCLUDED.role,
      status             = 'ACTIVE'::user_status_enum,
      failed_login_count = 0,
      locked_until       = NULL;

-- -----------------------------------------------------------------------------
-- 8. Stefan's calendar — populates the doctor schedule so the demo never
--    opens to an empty week. Uses CURRENT_DATE so the data stays "now".
-- -----------------------------------------------------------------------------
ALTER TABLE appointments DISABLE TRIGGER ALL;
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time,
                          duration_minutes, status, appointment_type, reason, created_by)
SELECT p.id, s.did, s.hid, t.d, t.t, t.dur,
       t.st::appointment_status_enum, t.ty::appointment_type_enum, t.r, 'STEFAN_SEED'
FROM (SELECT id AS did, hospital_id AS hid FROM doctors WHERE license_number = 'DR-STEFAN') s,
     (VALUES
       (2,  CURRENT_DATE,     '09:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'New patient consultation'),
       (3,  CURRENT_DATE,     '09:40'::time, 30, 'SCHEDULED', 'CHECKUP',      'Annual physical'),
       (4,  CURRENT_DATE,     '10:20'::time, 20, 'COMPLETED', 'FOLLOW_UP',    'Blood pressure follow-up'),
       (5,  CURRENT_DATE,     '11:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'Persistent headaches'),
       (6,  CURRENT_DATE,     '13:00'::time, 30, 'SCHEDULED', 'CHECKUP',      'Diabetes check'),
       (7,  CURRENT_DATE,     '14:20'::time, 20, 'SCHEDULED', 'FOLLOW_UP',    'Lab review'),
       (8,  CURRENT_DATE + 1, '09:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'Joint pain assessment'),
       (9,  CURRENT_DATE + 1, '09:40'::time, 30, 'SCHEDULED', 'CHECKUP',      'Wellness check'),
       (10, CURRENT_DATE + 1, '11:00'::time, 20, 'SCHEDULED', 'FOLLOW_UP',    'Medication review'),
       (11, CURRENT_DATE + 1, '13:40'::time, 30, 'SCHEDULED', 'PROCEDURE',    'Minor procedure'),
       (12, CURRENT_DATE + 2, '09:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'Initial consultation'),
       (2,  CURRENT_DATE + 2, '10:20'::time, 20, 'SCHEDULED', 'FOLLOW_UP',    'Recheck after antibiotics'),
       (3,  CURRENT_DATE + 2, '13:00'::time, 30, 'SCHEDULED', 'CHECKUP',      'Pre-operative consult'),
       (4,  CURRENT_DATE + 3, '09:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'Chest pain workup'),
       (5,  CURRENT_DATE + 3, '10:20'::time, 20, 'SCHEDULED', 'FOLLOW_UP',    'Cardiac follow-up'),
       (6,  CURRENT_DATE + 3, '14:00'::time, 30, 'SCHEDULED', 'CHECKUP',      'Diabetes check'),
       (7,  CURRENT_DATE + 4, '09:00'::time, 30, 'SCHEDULED', 'CONSULTATION', 'Skin lesion review'),
       (8,  CURRENT_DATE + 4, '11:00'::time, 30, 'SCHEDULED', 'FOLLOW_UP',    'Migraine therapy'),
       (9,  CURRENT_DATE + 5, '10:00'::time, 30, 'SCHEDULED', 'CHECKUP',      'Pediatric vaccination'),
       (2,  CURRENT_DATE - 1, '10:20'::time, 20, 'COMPLETED', 'FOLLOW_UP',    'Lab review'),
       (3,  CURRENT_DATE - 2, '14:00'::time, 30, 'COMPLETED', 'CHECKUP',      'Annual physical'),
       (4,  CURRENT_DATE - 3, '09:40'::time, 20, 'NO_SHOW',   'FOLLOW_UP',    NULL),
       (5,  CURRENT_DATE - 4, '13:00'::time, 30, 'COMPLETED', 'CONSULTATION', 'Initial consultation')
     ) AS t(rn, d, t, dur, st, ty, r)
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM patients) p ON p.rn = t.rn;
ALTER TABLE appointments ENABLE TRIGGER ALL;

-- =============================================================================
-- 9. Medical records for Stefan (DR-STEFAN, doctor_id resolved at runtime)
-- =============================================================================
ALTER TABLE appointments DISABLE TRIGGER ALL;
INSERT INTO medical_records (patient_id, doctor_id, hospital_id, appointment_id, diagnosis,
  mkb10_code, clinical_notes, blood_pressure, heart_rate, temperature, weight, height,
  assessment, plan, created_by)
SELECT a.patient_id, a.doctor_id, a.hospital_id, a.id,
  v.diagnosis, v.mkb10, v.notes, v.bp, v.hr, v.temp, v.wt, v.ht, v.assessment, v.plan, 'MOCK_SEED'
FROM (
  SELECT id, patient_id, doctor_id, hospital_id, appointment_date,
         row_number() OVER (ORDER BY appointment_date) AS rn
  FROM appointments
  WHERE doctor_id = (SELECT id FROM doctors WHERE license_number='DR-STEFAN') AND status='COMPLETED'
  LIMIT 5
) a
JOIN (VALUES
  (1, 'Essential Hypertension','I10','BP elevated at 145/92. Patient reports stress.','145/92',88,36.7,78,176,'Hypertension stage 1.','Start Amlodipine 5mg daily. Follow-up in 4 weeks.'),
  (2, 'Type 2 Diabetes Mellitus','E11','HbA1c 7.8%. Fasting glucose 9.2 mmol/L.','130/85',78,36.5,92,174,'Diabetes poorly controlled on diet alone.','Initiate Metformin 500mg twice daily.'),
  (3, 'Upper Respiratory Tract Infection','J06.9','Sore throat, mild fever 37.8°C, 3 days.','118/75',82,37.8,65,168,'Viral URTI, self-limiting.','Paracetamol 500mg as needed. Rest and fluids.'),
  (4, 'Hypercholesterolaemia','E78.0','Total cholesterol 6.8 mmol/L, LDL 4.2.','125/80',72,36.6,83,181,'Primary hypercholesterolaemia.','Start Rosuvastatin 10mg at night.'),
  (5, 'Gastroesophageal Reflux','K21.0','Heartburn 3x/week, worse after meals.','128/82',74,36.4,78,176,'GERD, mild-moderate.','Omeprazole 20mg before breakfast for 8 weeks.')
) AS v(rn, diagnosis, mkb10, notes, bp, hr, temp, wt, ht, assessment, plan) ON a.rn = v.rn
WHERE NOT EXISTS (SELECT 1 FROM medical_records mr WHERE mr.appointment_id = a.id);
ALTER TABLE appointments ENABLE TRIGGER ALL;

-- =============================================================================
-- 10. Medical records for Zoran (DR-ZORAN, doctor_id resolved at runtime)
-- =============================================================================
ALTER TABLE appointments DISABLE TRIGGER ALL;
INSERT INTO medical_records (patient_id, doctor_id, hospital_id, appointment_id, diagnosis,
  mkb10_code, clinical_notes, blood_pressure, heart_rate, temperature, weight, height,
  assessment, plan, created_by)
SELECT a.patient_id, a.doctor_id, a.hospital_id, a.id,
  v.diagnosis, v.mkb10, v.notes, v.bp, v.hr, v.temp, v.wt, v.ht, v.assessment, v.plan, 'MOCK_SEED'
FROM (
  SELECT id, patient_id, doctor_id, hospital_id, appointment_date,
         row_number() OVER (ORDER BY appointment_date) AS rn
  FROM appointments
  WHERE doctor_id = (SELECT id FROM doctors WHERE license_number='DR-ZORAN') AND status='COMPLETED'
  LIMIT 5
) a
JOIN (VALUES
  (1, 'Nephrolithiasis','N20.0','Recurrent stones, 6mm stone right ureter.','138/88',92,37.1,81,183,'Ureteral stone 6mm, medical expulsion therapy.','Tamsulosin 0.4mg nightly. Fluid intake >2.5L/day.'),
  (2, 'Benign Prostatic Hyperplasia','N40','IPSS score 18. PSA 2.1 ng/mL.','140/90',76,36.5,88,177,'Moderate BPH.','Finasteride 5mg daily. Review in 3 months.'),
  (3, 'Recurrent UTI','N39.0','Third UTI this year. E.coli resistant.','122/78',80,37.4,62,165,'Recurrent UTI, resistant organism.','Nitrofurantoin 100mg x5 days. Prophylaxis review.'),
  (4, 'Stress Urinary Incontinence','N39.3','Leakage on coughing/sneezing. Post-partum.','118/76',70,36.6,67,163,'Stress urinary incontinence.','Pelvic floor physiotherapy referral.'),
  (5, 'Bladder Stone','N21.0','Haematuria and dysuria. 8mm bladder stone.','132/84',84,36.8,90,179,'Bladder stone, symptomatic.','Cystolitholapaxy scheduled.')
) AS v(rn, diagnosis, mkb10, notes, bp, hr, temp, wt, ht, assessment, plan) ON a.rn = v.rn
WHERE NOT EXISTS (SELECT 1 FROM medical_records mr WHERE mr.appointment_id = a.id);
ALTER TABLE appointments ENABLE TRIGGER ALL;

-- =============================================================================
-- 11. Prescriptions for Stefan and Zoran
-- =============================================================================
INSERT INTO prescriptions (patient_id, doctor_id, medical_record_id, medication_name, dosage,
  frequency, duration_days, quantity, route, instructions, start_date, end_date, status, created_by)
SELECT mr.patient_id, mr.doctor_id, mr.id,
  v.name, v.dosage, v.freq, v.days, v.qty, 'ORAL'::prescription_route_enum, v.instructions,
  CURRENT_DATE - v.ago, CURRENT_DATE - v.ago + v.days,
  CASE WHEN CURRENT_DATE > CURRENT_DATE - v.ago + v.days THEN 'COMPLETED' ELSE 'ACTIVE' END::prescription_status_enum,
  'MOCK_SEED'
FROM (
  SELECT id, patient_id, doctor_id,
         row_number() OVER (PARTITION BY doctor_id ORDER BY id) AS rn
  FROM medical_records
  WHERE doctor_id IN (SELECT id FROM doctors WHERE license_number IN ('DR-STEFAN','DR-ZORAN'))
) mr
JOIN (VALUES
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 1, 'Amlodipine','5mg','Once daily',90,90,'Take in the morning.',10),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 2, 'Metformin','500mg','Twice daily',90,180,'Take with meals.',12),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 3, 'Paracetamol','500mg','Every 6h as needed',7,14,'Max 4 doses/day.',15),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 4, 'Rosuvastatin','10mg','Once at night',90,90,'Take at bedtime.',20),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 5, 'Omeprazole','20mg','Once before breakfast',56,56,'Take 30 min before first meal.',25),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  1, 'Tamsulosin','0.4mg','Once nightly',30,30,'Take at bedtime.',5),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  2, 'Finasteride','5mg','Once daily',90,90,'Full effect in 3-6 months.',8),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  3, 'Nitrofurantoin','100mg','Twice daily',5,10,'Take with food. Complete course.',7),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  4, 'Duloxetine','20mg','Twice daily',42,84,'Do not stop abruptly.',3),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  5, 'Tamsulosin','0.4mg','Once nightly',30,30,'Continue until procedure.',4)
) AS v(doc_id, rn, name, dosage, freq, days, qty, instructions, ago)
  ON mr.doctor_id = v.doc_id AND mr.rn = v.rn
WHERE NOT EXISTS (SELECT 1 FROM prescriptions p WHERE p.medical_record_id = mr.id AND p.medication_name = v.name);

-- =============================================================================
-- 12. Referrals for Stefan and Zoran
-- =============================================================================
INSERT INTO referrals (doctor_id, patient_id, referral_type, referred_to, referral_number,
  description, scheduled_date, status, created_by)
SELECT v.doc_id, p.id, v.rtype::referral_type_enum, v.referred_to,
  'UP-2026-' || LPAD(nextval('referral_number_seq')::text, 3, '0'),
  v.description, CURRENT_DATE + v.days_offset, v.status::referral_status_enum, 'MOCK_SEED'
FROM (VALUES
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 4, 'SPECIALIST','Ендокринологија','Неконтролиран Diabetes tip 2 — HbA1c 7.8%, ендокринолошка консултација.',14,'ACTIVE'),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 3, 'SPECIALIST','Гастроентерологија','ГЕРБ со несоодветен одговор на PPI — гастроскопија.',21,'ACTIVE'),
  ((SELECT id FROM doctors WHERE license_number='DR-STEFAN'), 2, 'LABORATORY','Кардиологија','Хиперхолестеролемија со умерен КВ ризик — стрес ЕКГ.',-7,'COMPLETED'),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  3, 'SPECIALIST','Нефрологија','Рекурентна УТИ — 3та епизода, резистентен организам.',10,'ACTIVE'),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  5, 'HOSPITAL','Физикална терапија','Стресна уринарна инконтиненција — програма за карличниот под.',7,'ACTIVE'),
  ((SELECT id FROM doctors WHERE license_number='DR-ZORAN'),  1, 'SPECIALIST','Нефрологија','Рекурентна нефролитијаза — метаболна обработка.',5,'CANCELLED')
) AS v(doc_id, pat_rn, rtype, referred_to, description, days_offset, status)
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM patients) p ON p.rn = v.pat_rn
WHERE NOT EXISTS (SELECT 1 FROM referrals r WHERE r.doctor_id = v.doc_id AND r.referred_to = v.referred_to AND r.patient_id = p.id);

-- -----------------------------------------------------------------------------
-- Nurse demo data — a full clinic day across multiple doctors so the Nurse
-- portal's "Today" tab is populated (completed, no-show and scheduled mix).
-- Hospital is taken from each doctor; slots guarded so the block is re-runnable.
-- -----------------------------------------------------------------------------
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time,
                          duration_minutes, status, appointment_type, reason, created_by)
SELECT p.id, doc.id, doc.hospital_id, CURRENT_DATE, v.t::time, v.dur,
       v.st::appointment_status_enum, v.ty::appointment_type_enum, v.r, 'NURSE_SEED'
FROM (VALUES
  (2,1,'08:00',20,'COMPLETED','CHECKUP',      'Систематски преглед'),
  (4,2,'08:30',20,'COMPLETED','CONSULTATION', 'Главоболка и вртоглавица'),
  (6,3,'09:00',30,'COMPLETED','FOLLOW_UP',    'Контрола по операција'),
  (8,1,'09:15',15,'NO_SHOW',  'CONSULTATION', 'Не се јави на термин'),
  (1,2,'10:00',20,'SCHEDULED','CONSULTATION', 'Покачен крвен притисок'),
  (3,4,'10:30',45,'SCHEDULED','PROCEDURE',    'Мала хируршка интервенција'),
  (5,5,'11:00',20,'SCHEDULED','CHECKUP',      'Годишен преглед'),
  (7,6,'11:30',30,'SCHEDULED','FOLLOW_UP',    'Контрола на терапија'),
  (9,7,'13:00',20,'SCHEDULED','CONSULTATION', 'Болки во грб'),
  (10,3,'14:00',20,'SCHEDULED','VIRTUAL',     'Видео консултација'),
  (11,1,'15:00',20,'SCHEDULED','CHECKUP',     'Превентивен преглед'),
  (12,8,'16:00',30,'SCHEDULED','CONSULTATION','Кожен осип')
) AS v(pat_rn, doc_rn, t, dur, st, ty, r)
JOIN (SELECT id, hospital_id, row_number() OVER (ORDER BY id) AS rn FROM doctors) doc ON doc.rn = v.doc_rn
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM patients) p ON p.rn = v.pat_rn
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a
  WHERE a.doctor_id = doc.id AND a.appointment_date = CURRENT_DATE AND a.appointment_time = v.t::time
);

-- -----------------------------------------------------------------------------
-- Individual reports — so the "Индивидуални пријави" page is populated for the
-- doctor (DR-STEFAN) and GP (DR-ZORAN). Mix of submitted reports + one draft
-- each (the draft can be submitted live during a demo).
-- -----------------------------------------------------------------------------
INSERT INTO doctor_reports (doctor_id, report_number, period_type, period_label, period_start, period_end,
                            patient_count, diagnosis_count, appointment_count, prescription_count, status, submitted_at)
SELECT d.id, v.num, v.ptype::report_period_type_enum, v.plabel, v.pstart::date, v.pend::date,
       v.pc, v.dc, v.ac, v.rc, v.st::report_status_enum,
       CASE WHEN v.st='SUBMITTED' THEN (v.pend::date + TIME '17:00') AT TIME ZONE 'Europe/Skopje' ELSE NULL END
FROM (VALUES
  ('DR-STEFAN','IP-DEMO-001','MONTHLY',  'Април 2026',   '2026-04-01','2026-04-30',18,22,31,14,'SUBMITTED'),
  ('DR-STEFAN','IP-DEMO-002','MONTHLY',  'Мај 2026',     '2026-05-01','2026-05-31',21,27,35,16,'SUBMITTED'),
  ('DR-STEFAN','IP-DEMO-003','QUARTERLY','Q1 2026',      '2026-01-01','2026-03-31',47,61,88,39,'SUBMITTED'),
  ('DR-STEFAN','IP-DEMO-004','MONTHLY',  'Јуни 2026',    '2026-06-01','2026-06-30', 9,11,14, 6,'DRAFT'),
  ('DR-ZORAN', 'IP-DEMO-005','MONTHLY',  'Мај 2026',     '2026-05-01','2026-05-31',15,19,26,12,'SUBMITTED'),
  ('DR-ZORAN', 'IP-DEMO-006','MONTHLY',  'Јуни 2026',    '2026-06-01','2026-06-30', 7, 8,10, 5,'DRAFT')
) AS v(lic, num, ptype, plabel, pstart, pend, pc, dc, ac, rc, st)
JOIN doctors d ON d.license_number = v.lic
WHERE NOT EXISTS (SELECT 1 FROM doctor_reports r WHERE r.report_number = v.num);

-- -----------------------------------------------------------------------------
-- 14. Dr Zoran Perovski — Urology specialist (shared password documented at top)
-- -----------------------------------------------------------------------------
WITH u AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  VALUES ('zoran.perovski@medtech.mk',
          '$2y$12$jBjc6F0gOUyPjx4sHhRzxu.HnyHmhV5EolJoOjV.9rh/aoLj3ZBI2',
          'Zoran', 'Perovski', '+389 70 555 111',
          'DOCTOR'::user_role_enum, 'ACTIVE'::user_status_enum, TRUE, 'MOCK_SEED')
  ON CONFLICT (email) DO UPDATE
    SET password_hash      = EXCLUDED.password_hash,
        failed_login_count = 0,
        locked_until       = NULL
  RETURNING id
)
INSERT INTO doctors (user_id, hospital_id, license_number, specialization, sub_specialization,
                     experience_years, consultation_fee, bio, status)
SELECT u.id,
       (SELECT id FROM hospitals WHERE name = 'Универзитетска клиника' LIMIT 1),
       'DR-ZORAN-URO', 'Urology',
       'Endourology, Urologic Oncology, Minimally Invasive Surgery',
       12, 2000,
       'Board-certified urologist specialising in minimally invasive and endourologic procedures.',
       'ACTIVE'::user_status_enum
FROM u
WHERE NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id);

-- -----------------------------------------------------------------------------
-- 15. Doctor working hours — Mon–Fri 09:00–17:00 for every doctor so the
--     patient booking flow always shows time slots. day_of_week is ISO
--     (1=Monday … 7=Sunday), matching LocalDate.getDayOfWeek().getValue().
-- -----------------------------------------------------------------------------
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active)
SELECT d.id, dow, '09:00'::time, '17:00'::time, TRUE
FROM doctors d
CROSS JOIN generate_series(1, 5) AS dow
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

COMMIT;

-- Quick summary
SELECT 'hospitals'        AS tbl, COUNT(*) FROM hospitals
UNION ALL SELECT 'doctors',         COUNT(*) FROM doctors
UNION ALL SELECT 'patients',        COUNT(*) FROM patients
UNION ALL SELECT 'appointments',    COUNT(*) FROM appointments
UNION ALL SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL SELECT 'prescriptions',   COUNT(*) FROM prescriptions
UNION ALL SELECT 'referrals',       COUNT(*) FROM referrals;
