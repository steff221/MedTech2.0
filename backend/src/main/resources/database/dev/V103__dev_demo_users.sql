-- =============================================================================
-- V103 — Dev-only demo users (moved out of medtech_schema_pg.sql so that a
-- production initdb never contains accounts with a published password hash).
-- Idempotent: skips rows that already exist (older dev databases were seeded
-- with these users by the schema script itself).
-- =============================================================================

BEGIN;

-- Doctor (user + doctor in one CTE) -----------------------------------------
WITH new_user AS (
    INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
    SELECT 'dr.petrov@medtech.mk',
           '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO',
           'Иван', 'Петров', '+389 70 234 567',
           'DOCTOR', 'ACTIVE', TRUE, 'SYSTEM'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dr.petrov@medtech.mk')
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
    SELECT 'patient1@medtech.mk',
           '$2a$10$dXJ3SW6G7P50eS6DmwzkKe.1Z7XvKRPZ9y.iR3dP8vJNuRpHKjYAO',
           'Мирна', 'Стефановска', '+389 70 111 222',
           'PATIENT', 'ACTIVE', TRUE, 'SYSTEM'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient1@medtech.mk')
    RETURNING id
)
INSERT INTO patients (user_id, date_of_birth, gender, blood_type, allergies, chronic_conditions,
                      insurance_provider, insurance_number, emergency_contact, emergency_phone,
                      address, city, postal_code, country)
SELECT new_user.id, DATE '1985-05-15', 'F', 'O+', 'Пеницилин', 'Хипертензија',
       'Blue Cross', 'BC-MK-123456', 'Марко Стефановски', '+389 75 555 666',
       'Ул. Гоце Делчев 45', 'Тетово', '1200', 'Македонија'
FROM new_user;

COMMIT;
