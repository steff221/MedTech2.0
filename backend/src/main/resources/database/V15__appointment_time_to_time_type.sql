-- Both views depend on appointment_time; drop them first, then recreate after the ALTER.
DROP VIEW IF EXISTS vw_patient_appointments;
DROP VIEW IF EXISTS vw_doctor_schedule;

ALTER TABLE appointments
    ALTER COLUMN appointment_time TYPE TIME
    USING appointment_time::time;

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
