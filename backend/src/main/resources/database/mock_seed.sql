-- =============================================================================
-- MedTech 2.0 — Demo Mock Data
-- =============================================================================
-- Idempotent: only inserts rows that don't already exist.
-- All mock users share password: Demo!Pass#2026
-- (hash below was generated via bcryptjs strength-12)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Hospitals across North Macedonia (extends the 3 already seeded)
-- -----------------------------------------------------------------------------
INSERT INTO hospitals (name, city, address, postal_code, phone_number, latitude, longitude, type, director_name, bed_count, status)
SELECT * FROM (VALUES
  ('Општа болница Битола',     'Битола',   'ул. Партизанска бб',     '7000', '+389 47 200 000', 41.02970::numeric, 21.32940::numeric, 'SECONDARY'::hospital_type_enum, 'Драган Илиевски',  280, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Охрид',      'Охрид',    'ул. Сирма Војвода 73',   '6000', '+389 46 200 000', 41.11720::numeric, 20.80140::numeric, 'SECONDARY'::hospital_type_enum, 'Игор Спасески',    220, 'ACTIVE'::hospital_status_enum),
  ('Клиничка болница Штип',    'Штип',     'ул. Тошо Арсов бб',      '2000', '+389 32 200 000', 41.74610::numeric, 22.19720::numeric, 'TERTIARY'::hospital_type_enum,  'Зоран Ѓоргиев',    310, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Прилеп',     'Прилеп',   'ул. 11 Октомври бб',     '7500', '+389 48 200 000', 41.34640::numeric, 21.55440::numeric, 'SECONDARY'::hospital_type_enum, 'Маја Петковска',   200, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Струмица',   'Струмица', 'ул. Млечен Пат бб',      '2400', '+389 34 200 000', 41.43780::numeric, 22.64110::numeric, 'SECONDARY'::hospital_type_enum, 'Никола Атанасов',  180, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Гостивар',   'Гостивар', 'ул. Браќа Гиноски бб',   '1230', '+389 42 200 000', 41.79720::numeric, 20.90280::numeric, 'SECONDARY'::hospital_type_enum, 'Ариф Незири',      160, 'ACTIVE'::hospital_status_enum),
  ('Општа болница Велес',      'Велес',    'ул. Шефки Сали бб',      '1400', '+389 43 200 000', 41.71560::numeric, 21.77580::numeric, 'SECONDARY'::hospital_type_enum, 'Љубомир Андонов',  170, 'ACTIVE'::hospital_status_enum)
) AS v(name, city, address, postal_code, phone_number, latitude, longitude, type, director_name, bed_count, status)
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE hospitals.name = v.name);

-- -----------------------------------------------------------------------------
-- 2. Mock doctors (6 new — joins the 2 existing for 8 total)
-- -----------------------------------------------------------------------------
-- Password for ALL mock accounts: Demo!Pass#2026
-- bcrypt strength 12

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
  SELECT email, '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
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

-- Backfill procedures into bio/sub_specialization for the 2 existing doctors
UPDATE doctors
SET sub_specialization = 'ECG, Echocardiogram, Stress Test, Holter Monitor, Cardiac Catheterization',
    bio = COALESCE(NULLIF(bio, ''), 'Board-certified Cardiology specialist.')
WHERE license_number IN ('LIC-MK-001', 'DR-0042') AND (sub_specialization IS NULL OR sub_specialization = '');

-- -----------------------------------------------------------------------------
-- 3. Mock patients (11 new — joins existing 1 for 12 total)
-- -----------------------------------------------------------------------------
WITH new_patients AS (
  SELECT * FROM (VALUES
    ('p.kostadinov@medtech.mk',  'Петар',     'Костадинов',   'M', '1988-03-12', 'O+',  'Скопје',    'ул. Партизанска 25'),
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
  SELECT email, '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
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

-- -----------------------------------------------------------------------------
-- 4. Mock appointments (~40 spread across past 2 weeks → next 2 weeks)
-- -----------------------------------------------------------------------------
-- Generate a deterministic-ish spread using row_number() against the cross product.
INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, duration_minutes, status, appointment_type, reason, created_by)
SELECT
  p.id,
  d.id,
  d.hospital_id,
  CURRENT_DATE + ((row_number() OVER ())::int % 21 - 10) AS appointment_date,
  -- Slot times across the working day, deterministic per row
  CASE (row_number() OVER ())::int % 8
    WHEN 0 THEN '09:00' WHEN 1 THEN '09:40' WHEN 2 THEN '10:20'
    WHEN 3 THEN '11:00' WHEN 4 THEN '11:40' WHEN 5 THEN '13:00'
    WHEN 6 THEN '14:20' ELSE '15:00'
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
LIMIT 40
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Mock medical records (~15)
-- -----------------------------------------------------------------------------
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

COMMIT;

-- Quick summary
SELECT 'hospitals'        AS table, COUNT(*) FROM hospitals
UNION ALL SELECT 'doctors',         COUNT(*) FROM doctors
UNION ALL SELECT 'patients',        COUNT(*) FROM patients
UNION ALL SELECT 'appointments',    COUNT(*) FROM appointments
UNION ALL SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL SELECT 'prescriptions',   COUNT(*) FROM prescriptions;
