-- ============================================================================
-- MedTech Medical Administration System - Oracle Database Schema
-- Enterprise-grade implementation with audit trails, constraints, and indexing
-- Version: 1.0
-- Created: 2026
-- Database: Oracle 21c+
-- ============================================================================

-- ============================================================================
-- PART 1: SEQUENCES (Primary Key Generators)
-- ============================================================================
CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE patients_seq START WITH 1000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE doctors_seq START WITH 2000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE hospitals_seq START WITH 3000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE appointments_seq START WITH 4000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE prescriptions_seq START WITH 5000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE medical_records_seq START WITH 6000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE operations_seq START WITH 7000 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE audit_logs_seq START WITH 8000 INCREMENT BY 1 NOCACHE;

-- ============================================================================
-- PART 2: CORE DOMAIN TABLES
-- ============================================================================

-- ============================================================================
-- USERS TABLE (Base authentication and identity)
-- ============================================================================
CREATE TABLE users (
    id                  NUMBER PRIMARY KEY,
    email               VARCHAR2(255) NOT NULL UNIQUE,
    password_hash       VARCHAR2(255) NOT NULL,
    first_name          VARCHAR2(100) NOT NULL,
    last_name           VARCHAR2(100) NOT NULL,
    phone_number        VARCHAR2(20),
    role                VARCHAR2(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN', 'NURSE')),
    status              VARCHAR2(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    email_verified      CHAR(1) DEFAULT 'N' CHECK (email_verified IN ('Y', 'N')),
    last_login          TIMESTAMP,
    failed_login_count  NUMBER DEFAULT 0,
    locked_until        TIMESTAMP,
    created_by          VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by          VARCHAR2(100),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) TABLESPACE USERS_TS;

-- ============================================================================
-- PATIENTS TABLE (Patient demographics and health data)
-- ============================================================================
CREATE TABLE patients (
    id                  NUMBER PRIMARY KEY,
    user_id             NUMBER NOT NULL UNIQUE,
    date_of_birth       DATE NOT NULL,
    gender              CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    blood_type          VARCHAR2(10) CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    allergies           CLOB,
    chronic_conditions  CLOB,
    insurance_provider  VARCHAR2(255),
    insurance_number    VARCHAR2(100),
    emergency_contact   VARCHAR2(255),
    emergency_phone     VARCHAR2(20),
    address             VARCHAR2(500),
    city                VARCHAR2(100),
    postal_code         VARCHAR2(20),
    country             VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_patients_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) TABLESPACE PATIENTS_TS;

-- ============================================================================
-- HOSPITALS TABLE (Healthcare facilities and locations)
-- ============================================================================
CREATE TABLE hospitals (
    id                  NUMBER PRIMARY KEY,
    name                VARCHAR2(255) NOT NULL UNIQUE,
    city                VARCHAR2(100) NOT NULL,
    address             VARCHAR2(500) NOT NULL,
    postal_code         VARCHAR2(20),
    phone_number        VARCHAR2(20),
    latitude            NUMBER(10, 8),
    longitude           NUMBER(11, 8),
    type                VARCHAR2(50) CHECK (type IN ('PRIMARY', 'SECONDARY', 'TERTIARY', 'PRIVATE', 'CLINIC')),
    director_name       VARCHAR2(255),
    bed_count           NUMBER,
    status              VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) TABLESPACE HOSPITALS_TS;

-- ============================================================================
-- DOCTORS TABLE (Physician and healthcare provider information)
-- ============================================================================
CREATE TABLE doctors (
    id                  NUMBER PRIMARY KEY,
    user_id             NUMBER NOT NULL UNIQUE,
    hospital_id         NUMBER NOT NULL,
    license_number      VARCHAR2(100) NOT NULL UNIQUE,
    specialization      VARCHAR2(255) NOT NULL,
    sub_specialization  VARCHAR2(255),
    qualification       VARCHAR2(500),
    experience_years    NUMBER,
    office_number       VARCHAR2(50),
    consultation_fee    NUMBER(10, 2),
    availability_hours  VARCHAR2(255),
    bio                 CLOB,
    status              VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_doctors_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctors_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) TABLESPACE DOCTORS_TS;

-- ============================================================================
-- APPOINTMENTS TABLE (Patient-Doctor appointment scheduling)
-- ============================================================================
CREATE TABLE appointments (
    id                  NUMBER PRIMARY KEY,
    patient_id          NUMBER NOT NULL,
    doctor_id           NUMBER NOT NULL,
    hospital_id         NUMBER NOT NULL,
    appointment_date    DATE NOT NULL,
    appointment_time    VARCHAR2(10) NOT NULL,
    duration_minutes    NUMBER DEFAULT 30,
    status              VARCHAR2(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED')),
    appointment_type    VARCHAR2(50) CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'CHECKUP')),
    reason              VARCHAR2(500),
    notes               CLOB,
    cancelled_by        VARCHAR2(100),
    cancellation_reason VARCHAR2(500),
    created_by          VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by          VARCHAR2(100),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_appointments_patients FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_doctors FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_appointments_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    CONSTRAINT chk_appointment_datetime CHECK (appointment_date > TRUNC(SYSDATE))
) TABLESPACE APPOINTMENTS_TS;

-- ============================================================================
-- MEDICAL_RECORDS TABLE (Patient health history and clinical notes)
-- ============================================================================
CREATE TABLE medical_records (
    id                  NUMBER PRIMARY KEY,
    patient_id          NUMBER NOT NULL,
    doctor_id           NUMBER NOT NULL,
    hospital_id         NUMBER NOT NULL,
    appointment_id      NUMBER,
    diagnosis           VARCHAR2(500),
    mkb10_code          VARCHAR2(20),
    clinical_notes      CLOB NOT NULL,
    vital_signs         VARCHAR2(500),
    blood_pressure      VARCHAR2(20),
    heart_rate          NUMBER,
    temperature         NUMBER(5, 2),
    weight              NUMBER(5, 2),
    height              NUMBER(5, 2),
    bmi                 NUMBER(5, 2),
    assessment          CLOB,
    plan                CLOB,
    is_confidential      CHAR(1) DEFAULT 'N' CHECK (is_confidential IN ('Y', 'N')),
    created_by          VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by          VARCHAR2(100),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_med_records_patients FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_med_records_doctors FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_med_records_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    CONSTRAINT fk_med_records_appointments FOREIGN KEY (appointment_id) REFERENCES appointments(id)
) TABLESPACE MEDICAL_RECORDS_TS;

-- ============================================================================
-- PRESCRIPTIONS TABLE (Medication prescriptions with audit trail)
-- ============================================================================
CREATE TABLE prescriptions (
    id                  NUMBER PRIMARY KEY,
    patient_id          NUMBER NOT NULL,
    doctor_id           NUMBER NOT NULL,
    medical_record_id   NUMBER,
    medication_name     VARCHAR2(255) NOT NULL,
    dosage              VARCHAR2(100) NOT NULL,
    frequency           VARCHAR2(100) NOT NULL,
    duration_days       NUMBER,
    quantity            NUMBER,
    route               VARCHAR2(50) CHECK (route IN ('ORAL', 'INJECTION', 'TOPICAL', 'INHALED', 'IV', 'IM', 'SC')),
    instructions        CLOB,
    start_date          DATE NOT NULL,
    end_date            DATE,
    status              VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED')),
    filled_at_pharmacy  DATE,
    pharmacy_name       VARCHAR2(255),
    refills_allowed     NUMBER DEFAULT 0,
    refills_used        NUMBER DEFAULT 0,
    created_by          VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by          VARCHAR2(100),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_prescriptions_patients FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_doctors FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_prescriptions_med_records FOREIGN KEY (medical_record_id) REFERENCES medical_records(id),
    CONSTRAINT chk_prescription_dates CHECK (end_date IS NULL OR end_date >= start_date)
) TABLESPACE PRESCRIPTIONS_TS;

-- ============================================================================
-- OPERATIONS TABLE (Surgical procedures and operations)
-- ============================================================================
CREATE TABLE operations (
    id                  NUMBER PRIMARY KEY,
    patient_id          NUMBER NOT NULL,
    doctor_id           NUMBER NOT NULL,
    hospital_id         NUMBER NOT NULL,
    operation_name      VARCHAR2(255) NOT NULL,
    operation_date      DATE NOT NULL,
    operation_time      VARCHAR2(10),
    duration_minutes    NUMBER,
    operation_room      VARCHAR2(50),
    surgical_team       VARCHAR2(500),
    anesthesia_type     VARCHAR2(100),
    anesthesiologist    VARCHAR2(255),
    pre_operative_notes CLOB,
    intra_operative_notes CLOB,
    post_operative_notes CLOB,
    complications       VARCHAR2(500),
    outcome             VARCHAR2(500),
    status              VARCHAR2(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    implants_used       CLOB,
    created_by          VARCHAR2(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by          VARCHAR2(100),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_operations_patients FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_operations_doctors FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_operations_hospitals FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) TABLESPACE OPERATIONS_TS;

-- ============================================================================
-- AUDIT_LOGS TABLE (Comprehensive audit trail for compliance)
-- ============================================================================
CREATE TABLE audit_logs (
    id                  NUMBER PRIMARY KEY,
    user_id             NUMBER,
    action_type         VARCHAR2(50) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT')),
    entity_type         VARCHAR2(100) NOT NULL,
    entity_id           NUMBER,
    old_values          CLOB,
    new_values          CLOB,
    description         VARCHAR2(500),
    ip_address          VARCHAR2(45),
    user_agent          VARCHAR2(500),
    status              VARCHAR2(20) CHECK (status IN ('SUCCESS', 'FAILURE')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_audit_logs_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) TABLESPACE AUDIT_TS;

-- ============================================================================
-- PART 3: PRIMARY KEY CONSTRAINTS (Already created with table definitions)
-- ============================================================================

-- ============================================================================
-- PART 4: COMPOSITE & FUNCTIONAL INDEXES (Performance optimization)
-- ============================================================================

-- Authentication and Login Performance
CREATE INDEX idx_users_email ON users(email) TABLESPACE USERS_IDX;
CREATE INDEX idx_users_status ON users(status) TABLESPACE USERS_IDX;
CREATE INDEX idx_users_role ON users(role) TABLESPACE USERS_IDX;
CREATE INDEX idx_users_created_at ON users(created_at DESC) TABLESPACE USERS_IDX;
CREATE INDEX idx_users_last_login ON users(last_login DESC) TABLESPACE USERS_IDX;

-- Patient Lookup Performance
CREATE INDEX idx_patients_user_id ON patients(user_id) TABLESPACE PATIENTS_IDX;
CREATE INDEX idx_patients_city ON patients(city) TABLESPACE PATIENTS_IDX;
CREATE INDEX idx_patients_blood_type ON patients(blood_type) TABLESPACE PATIENTS_IDX;
CREATE INDEX idx_patients_dob ON patients(date_of_birth) TABLESPACE PATIENTS_IDX;
CREATE COMPOSITE INDEX idx_patients_location ON patients(city, postal_code) TABLESPACE PATIENTS_IDX;

-- Doctor Lookup and Specialization Search
CREATE INDEX idx_doctors_user_id ON doctors(user_id) TABLESPACE DOCTORS_IDX;
CREATE INDEX idx_doctors_hospital_id ON doctors(hospital_id) TABLESPACE DOCTORS_IDX;
CREATE INDEX idx_doctors_specialization ON doctors(specialization) TABLESPACE DOCTORS_IDX;
CREATE INDEX idx_doctors_status ON doctors(status) TABLESPACE DOCTORS_IDX;
CREATE INDEX idx_doctors_license ON doctors(license_number) TABLESPACE DOCTORS_IDX;
CREATE COMPOSITE INDEX idx_doctors_hospital_spec ON doctors(hospital_id, specialization) TABLESPACE DOCTORS_IDX;
CREATE COMPOSITE INDEX idx_doctors_spec_status ON doctors(specialization, status) TABLESPACE DOCTORS_IDX;

-- Hospital Location and Search
CREATE INDEX idx_hospitals_city ON hospitals(city) TABLESPACE HOSPITALS_IDX;
CREATE INDEX idx_hospitals_type ON hospitals(type) TABLESPACE HOSPITALS_IDX;
CREATE INDEX idx_hospitals_status ON hospitals(status) TABLESPACE HOSPITALS_IDX;
CREATE COMPOSITE INDEX idx_hospitals_city_type ON hospitals(city, type) TABLESPACE HOSPITALS_IDX;

-- Appointment Scheduling and Lookup
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id) TABLESPACE APPOINTMENTS_IDX;
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id) TABLESPACE APPOINTMENTS_IDX;
CREATE INDEX idx_appointments_hospital_id ON appointments(hospital_id) TABLESPACE APPOINTMENTS_IDX;
CREATE INDEX idx_appointments_date ON appointments(appointment_date DESC) TABLESPACE APPOINTMENTS_IDX;
CREATE INDEX idx_appointments_status ON appointments(status) TABLESPACE APPOINTMENTS_IDX;
CREATE COMPOSITE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date) TABLESPACE APPOINTMENTS_IDX;
CREATE COMPOSITE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date DESC) TABLESPACE APPOINTMENTS_IDX;
CREATE COMPOSITE INDEX idx_appointments_date_status ON appointments(appointment_date, status) TABLESPACE APPOINTMENTS_IDX;
CREATE COMPOSITE INDEX idx_appointments_lookup ON appointments(patient_id, doctor_id, appointment_date) TABLESPACE APPOINTMENTS_IDX;

-- Medical Records Retrieval
CREATE INDEX idx_med_records_patient_id ON medical_records(patient_id) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE INDEX idx_med_records_doctor_id ON medical_records(doctor_id) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE INDEX idx_med_records_hospital_id ON medical_records(hospital_id) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE INDEX idx_med_records_appointment_id ON medical_records(appointment_id) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE INDEX idx_med_records_mkb10 ON medical_records(mkb10_code) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE INDEX idx_med_records_created_at ON medical_records(created_at DESC) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE COMPOSITE INDEX idx_med_records_patient_date ON medical_records(patient_id, created_at DESC) TABLESPACE MEDICAL_RECORDS_IDX;
CREATE COMPOSITE INDEX idx_med_records_diagnosis ON medical_records(patient_id, mkb10_code) TABLESPACE MEDICAL_RECORDS_IDX;

-- Prescription Retrieval and Management
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id) TABLESPACE PRESCRIPTIONS_IDX;
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id) TABLESPACE PRESCRIPTIONS_IDX;
CREATE INDEX idx_prescriptions_med_record_id ON prescriptions(medical_record_id) TABLESPACE PRESCRIPTIONS_IDX;
CREATE INDEX idx_prescriptions_status ON prescriptions(status) TABLESPACE PRESCRIPTIONS_IDX;
CREATE INDEX idx_prescriptions_start_date ON prescriptions(start_date DESC) TABLESPACE PRESCRIPTIONS_IDX;
CREATE COMPOSITE INDEX idx_prescriptions_patient_status ON prescriptions(patient_id, status) TABLESPACE PRESCRIPTIONS_IDX;
CREATE COMPOSITE INDEX idx_prescriptions_patient_date ON prescriptions(patient_id, start_date DESC) TABLESPACE PRESCRIPTIONS_IDX;

-- Operation Tracking
CREATE INDEX idx_operations_patient_id ON operations(patient_id) TABLESPACE OPERATIONS_IDX;
CREATE INDEX idx_operations_doctor_id ON operations(doctor_id) TABLESPACE OPERATIONS_IDX;
CREATE INDEX idx_operations_hospital_id ON operations(hospital_id) TABLESPACE OPERATIONS_IDX;
CREATE INDEX idx_operations_date ON operations(operation_date DESC) TABLESPACE OPERATIONS_IDX;
CREATE INDEX idx_operations_status ON operations(status) TABLESPACE OPERATIONS_IDX;
CREATE COMPOSITE INDEX idx_operations_patient_date ON operations(patient_id, operation_date DESC) TABLESPACE OPERATIONS_IDX;

-- Audit Trail Performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) TABLESPACE AUDIT_IDX;
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type) TABLESPACE AUDIT_IDX;
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC) TABLESPACE AUDIT_IDX;
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type) TABLESPACE AUDIT_IDX;
CREATE COMPOSITE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC) TABLESPACE AUDIT_IDX;
CREATE COMPOSITE INDEX idx_audit_logs_entity_action ON audit_logs(entity_type, action_type, created_at DESC) TABLESPACE AUDIT_IDX;

-- ============================================================================
-- PART 5: VIEWS (Simplified data access patterns)
-- ============================================================================

-- Patient with Doctor Availability
CREATE VIEW vw_patient_appointments AS
SELECT 
    a.id,
    a.patient_id,
    p.user_id as patient_user_id,
    u_patient.first_name || ' ' || u_patient.last_name as patient_name,
    a.doctor_id,
    d.specialization,
    u_doctor.first_name || ' ' || u_doctor.last_name as doctor_name,
    h.name as hospital_name,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.created_at
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u_patient ON p.user_id = u_patient.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users u_doctor ON d.user_id = u_doctor.id
JOIN hospitals h ON a.hospital_id = h.id;

-- Doctor Schedule View
CREATE VIEW vw_doctor_schedule AS
SELECT 
    d.id as doctor_id,
    u.first_name || ' ' || u.last_name as doctor_name,
    d.specialization,
    h.name as hospital_name,
    a.appointment_date,
    a.appointment_time,
    COUNT(*) OVER (PARTITION BY d.id, a.appointment_date) as appointments_today,
    a.status
FROM doctors d
JOIN users u ON d.user_id = u.id
JOIN hospitals h ON d.hospital_id = h.id
LEFT JOIN appointments a ON d.id = a.doctor_id
WHERE d.status = 'ACTIVE' AND u.status = 'ACTIVE';

-- Patient Medical History
CREATE VIEW vw_patient_medical_history AS
SELECT 
    mr.id,
    p.id as patient_id,
    u.first_name || ' ' || u.last_name as patient_name,
    d.specialization,
    u_doc.first_name || ' ' || u_doc.last_name as doctor_name,
    mr.diagnosis,
    mr.mkb10_code,
    mr.created_at as visit_date,
    mr.is_confidential
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
JOIN users u ON p.user_id = u.id
JOIN doctors d ON mr.doctor_id = d.id
JOIN users u_doc ON d.user_id = u_doc.id
ORDER BY mr.created_at DESC;

-- ============================================================================
-- PART 6: TRIGGERS (Automatic audit trail and data validation)
-- ============================================================================

-- Users Audit Trigger
CREATE OR REPLACE TRIGGER trg_users_audit
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        INSERT INTO audit_logs (id, user_id, action_type, entity_type, entity_id, new_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, :NEW.id, 'INSERT', 'USERS', :NEW.id, 
                'EMAIL:' || :NEW.email || '|ROLE:' || :NEW.role, CURRENT_TIMESTAMP);
    ELSIF UPDATING THEN
        IF :OLD.password_hash != :NEW.password_hash OR :OLD.status != :NEW.status THEN
            INSERT INTO audit_logs (id, user_id, action_type, entity_type, entity_id, old_values, new_values, created_at)
            VALUES (audit_logs_seq.NEXTVAL, :NEW.id, 'UPDATE', 'USERS', :NEW.id,
                    'STATUS:' || :OLD.status, 'STATUS:' || :NEW.status, CURRENT_TIMESTAMP);
        END IF;
    END IF;
END;
/

-- Appointments Audit Trigger
CREATE OR REPLACE TRIGGER trg_appointments_audit
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        INSERT INTO audit_logs (id, action_type, entity_type, entity_id, new_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, 'INSERT', 'APPOINTMENTS', :NEW.id,
                'PATIENT:' || :NEW.patient_id || '|DOCTOR:' || :NEW.doctor_id || '|DATE:' || :NEW.appointment_date,
                CURRENT_TIMESTAMP);
    ELSIF UPDATING THEN
        INSERT INTO audit_logs (id, action_type, entity_type, entity_id, old_values, new_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, 'UPDATE', 'APPOINTMENTS', :NEW.id,
                'STATUS:' || :OLD.status, 'STATUS:' || :NEW.status, CURRENT_TIMESTAMP);
    ELSIF DELETING THEN
        INSERT INTO audit_logs (id, action_type, entity_type, entity_id, old_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, 'DELETE', 'APPOINTMENTS', :OLD.id,
                'PATIENT:' || :OLD.patient_id || '|DATE:' || :OLD.appointment_date, CURRENT_TIMESTAMP);
    END IF;
END;
/

-- Prescriptions Audit Trigger
CREATE OR REPLACE TRIGGER trg_prescriptions_audit
AFTER INSERT OR UPDATE ON prescriptions
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        INSERT INTO audit_logs (id, action_type, entity_type, entity_id, new_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, 'INSERT', 'PRESCRIPTIONS', :NEW.id,
                'MEDICATION:' || :NEW.medication_name || '|PATIENT:' || :NEW.patient_id, CURRENT_TIMESTAMP);
    ELSIF UPDATING AND :OLD.status != :NEW.status THEN
        INSERT INTO audit_logs (id, action_type, entity_type, entity_id, old_values, new_values, created_at)
        VALUES (audit_logs_seq.NEXTVAL, 'UPDATE', 'PRESCRIPTIONS', :NEW.id,
                'STATUS:' || :OLD.status, 'STATUS:' || :NEW.status, CURRENT_TIMESTAMP);
    END IF;
END;
/

-- ============================================================================
-- PART 7: SEED DATA (Sample data for testing - Macedonian context)
-- ============================================================================

-- Insert Hospitals (Real Macedonian hospitals)
INSERT INTO hospitals VALUES 
(hospitals_seq.NEXTVAL, 'Клиничка болница Тетово', 'Тетово', 'ул. Болнична 1', '1200', '+389 49 123 456', 
 41.9940, 20.9740, 'PRIMARY', 'Д-р Иван Петров', 200, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO hospitals VALUES 
(hospitals_seq.NEXTVAL, 'Универзитетска клиника', 'Скопје', 'ул. Водњанска 17', '1000', '+389 2 309 3000', 
 41.9973, 21.4280, 'TERTIARY', 'Проф. Д-р Марко Миланов', 500, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO hospitals VALUES 
(hospitals_seq.NEXTVAL, 'Болница Куманово', 'Куманово', 'ул. Болнична 50', '1300', '+389 31 245 123', 
 42.1327, 21.7156, 'SECONDARY', 'Д-р Александар Стојев', 150, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Admin User
INSERT INTO users VALUES 
(users_seq.NEXTVAL, 'admin@medtech.mk', '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO', 
 'Admin', 'System', '+389 2 123 4567', 'ADMIN', 'ACTIVE', 'Y', CURRENT_TIMESTAMP, 0, NULL, 'SYSTEM', CURRENT_TIMESTAMP, NULL, NULL);

-- Insert Sample Doctor
INSERT INTO users VALUES 
(users_seq.NEXTVAL, 'dr.petrov@medtech.mk', '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO', 
 'Иван', 'Петров', '+389 70 234 567', 'DOCTOR', 'ACTIVE', 'Y', CURRENT_TIMESTAMP, 0, NULL, 'SYSTEM', CURRENT_TIMESTAMP, NULL, NULL);

INSERT INTO doctors VALUES 
(doctors_seq.NEXTVAL, users_seq.CURRVAL, 3000, 'LIC-MK-001', 'Кардиология', 'Интервенциона кардиология', 
 'MD, PhD Cardiology University of Skopje', 15, '301', 100.00, '08:00-16:00', 'Специјалист по болести на срцето', 
 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Patient
INSERT INTO users VALUES 
(users_seq.NEXTVAL, 'patient1@medtech.mk', '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO', 
 'Мирна', 'Стефановска', '+389 70 111 222', 'PATIENT', 'ACTIVE', 'Y', CURRENT_TIMESTAMP, 0, NULL, 'SYSTEM', CURRENT_TIMESTAMP, NULL, NULL);

INSERT INTO patients VALUES 
(patients_seq.NEXTVAL, users_seq.CURRVAL, TO_DATE('1985-05-15', 'YYYY-MM-DD'), 'F', 'O+', 'Пеницилин', 
 'Хипертензија', 'Blue Cross', 'BC-MK-123456', 'Марко Стефановски', '+389 75 555 666', 
 'Ул. Гоце Делчев 45', 'Тетово', '1200', 'Македонија', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;

-- ============================================================================
-- PART 8: GRANTS (Role-based access control)
-- ============================================================================

-- Note: Uncomment these when users are created in your application
-- CREATE ROLE medtech_doctor;
-- CREATE ROLE medtech_patient;
-- CREATE ROLE medtech_admin;
-- 
-- GRANT SELECT, INSERT, UPDATE ON appointments TO medtech_doctor;
-- GRANT SELECT, INSERT ON medical_records TO medtech_doctor;
-- GRANT SELECT, INSERT ON prescriptions TO medtech_doctor;
-- 
-- GRANT SELECT, INSERT ON appointments TO medtech_patient;
-- GRANT SELECT ON medical_records TO medtech_patient;
-- GRANT SELECT ON prescriptions TO medtech_patient;

-- ============================================================================
-- PART 9: TABLESPACES (For production deployment)
-- ============================================================================
-- Note: Run these commands BEFORE creating tables if using separate tablespaces
-- CREATE TABLESPACE users_ts DATAFILE 'users_ts.dbf' SIZE 100M;
-- CREATE TABLESPACE patients_ts DATAFILE 'patients_ts.dbf' SIZE 200M;
-- CREATE TABLESPACE doctors_ts DATAFILE 'doctors_ts.dbf' SIZE 100M;
-- CREATE TABLESPACE hospitals_ts DATAFILE 'hospitals_ts.dbf' SIZE 50M;
-- CREATE TABLESPACE appointments_ts DATAFILE 'appointments_ts.dbf' SIZE 300M;
-- CREATE TABLESPACE medical_records_ts DATAFILE 'medical_records_ts.dbf' SIZE 500M;
-- CREATE TABLESPACE prescriptions_ts DATAFILE 'prescriptions_ts.dbf' SIZE 200M;
-- CREATE TABLESPACE operations_ts DATAFILE 'operations_ts.dbf' SIZE 200M;
-- CREATE TABLESPACE audit_ts DATAFILE 'audit_ts.dbf' SIZE 300M;
-- CREATE TABLESPACE users_idx ON users_ts;
-- CREATE TABLESPACE patients_idx ON patients_ts;
-- ... (continue for all tablespaces)

-- ============================================================================
-- STATISTICS
-- ============================================================================
-- Generate table and index statistics for query optimizer
BEGIN
  DBMS_STATS.GATHER_SCHEMA_STATS('SYSTEM', options => 'GATHER');
END;
/

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify schema creation:
-- SELECT COUNT(*) as table_count FROM user_tables WHERE table_name NOT LIKE 'BIN$%';
-- SELECT COUNT(*) as index_count FROM user_indexes;
-- SELECT COUNT(*) as trigger_count FROM user_triggers;
-- SELECT COUNT(*) as view_count FROM user_views;
