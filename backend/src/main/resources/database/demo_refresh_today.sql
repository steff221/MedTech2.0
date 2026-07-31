-- ---------------------------------------------------------------------------
-- Keeps the demo looking alive: gives the general doctor (DR-STEFAN) and the
-- GP (DR-ZORAN) a clinic list for today and tomorrow.
--
-- mock_seed.sql lays down appointments relative to the day it was applied, so
-- after a few days every dashboard except the freshly seeded one shows an empty
-- "today". Run this on the morning of a demo:
--
--   docker exec -i medtech-postgres psql -U postgres -d medtech \
--     < backend/src/main/resources/database/demo_refresh_today.sql
--
-- Re-runnable: rows are tagged DEMO_TODAY and cleared before reinsertion.
-- Dr. Zoran Perovski's urology data lives in demo_zoran_urology.sql.
-- ---------------------------------------------------------------------------

BEGIN;

DELETE FROM appointments WHERE created_by = 'DEMO_TODAY';

-- Times sit inside the 09:00–17:00 availability both doctors have Mon–Fri, and
-- avoid the uq_appointments_doctor_slot (doctor, date, time) collision.
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date,
                          appointment_time, duration_minutes, status,
                          appointment_type, reason, notes, created_by)
SELECT v.patient_id, d.id, d.hospital_id,
       (now() AT TIME ZONE 'Europe/Skopje')::date + v.day_offset, v.at, 30, v.status::appointment_status_enum,
       v.kind::appointment_type_enum, v.reason, v.notes, 'DEMO_TODAY'
FROM (VALUES
  -- Dr. Stefan Perovski — Internal Medicine
  ('DR-STEFAN', 2,  0, TIME '09:00', 'COMPLETED', 'CHECKUP',      'Annual health check',           'Bloods requested.'),
  ('DR-STEFAN', 3,  0, TIME '10:00', 'COMPLETED', 'FOLLOW_UP',    'Hypertension review',           'BP well controlled.'),
  ('DR-STEFAN', 4,  0, TIME '11:30', 'SCHEDULED', 'CONSULTATION', 'Fatigue and weight loss',       NULL),
  ('DR-STEFAN', 5,  0, TIME '14:00', 'SCHEDULED', 'FOLLOW_UP',    'Diabetes management review',    NULL),
  ('DR-STEFAN', 6,  1, TIME '09:30', 'SCHEDULED', 'CONSULTATION', 'Chest discomfort on exertion',  NULL),
  ('DR-STEFAN', 7,  1, TIME '11:00', 'SCHEDULED', 'CHECKUP',      'Preventive health screening',   NULL),
  -- Dr. Zoran Nikolovski — General Practice (GP portal)
  ('DR-ZORAN',  8,  0, TIME '09:15', 'COMPLETED', 'CONSULTATION', 'Sore throat and fever',         'Viral illness, symptomatic care.'),
  ('DR-ZORAN',  9,  0, TIME '10:30', 'COMPLETED', 'CHECKUP',      'Routine wellness visit',        'All parameters normal.'),
  ('DR-ZORAN', 10,  0, TIME '12:00', 'SCHEDULED', 'FOLLOW_UP',    'Medication review',             NULL),
  ('DR-ZORAN', 11,  0, TIME '15:00', 'SCHEDULED', 'CONSULTATION', 'Lower back pain',               NULL),
  ('DR-ZORAN', 12,  1, TIME '09:00', 'SCHEDULED', 'CONSULTATION', 'Seasonal allergy symptoms',     NULL),
  ('DR-ZORAN',  1,  1, TIME '10:15', 'SCHEDULED', 'FOLLOW_UP',    'Referral outcome discussion',   NULL)
) AS v(lic, patient_id, day_offset, at, status, kind, reason, notes)
JOIN doctors d ON d.license_number = v.lic;

COMMIT;

SELECT u.first_name || ' ' || u.last_name AS doctor,
       count(*) FILTER (WHERE a.appointment_date = (now() AT TIME ZONE 'Europe/Skopje')::date)     AS today,
       count(*) FILTER (WHERE a.appointment_date = (now() AT TIME ZONE 'Europe/Skopje')::date + 1) AS tomorrow
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN users u   ON u.id = d.user_id
WHERE a.appointment_date >= (now() AT TIME ZONE 'Europe/Skopje')::date
GROUP BY 1 ORDER BY 1;
