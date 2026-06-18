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

-- -----------------------------------------------------------------------------
-- 7. Named demo accounts (all use the shared demo password documented at the
--    top of this file — never put real or personal passwords in this file)
-- -----------------------------------------------------------------------------
-- patient@medtech.mk (renamed from p.kostadinov@medtech.mk above)
UPDATE users
SET password_hash = '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
    failed_login_count = 0,
    locked_until = NULL
WHERE email = 'patient@medtech.mk';

-- stefan@medtech.mk (DOCTOR at Универзитетска клиника, Skopje)
WITH u AS (
  INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
  VALUES ('stefan@medtech.mk',
          '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
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
          '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
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

-- nurse@medtech.mk / Demo!Pass#2026  (NURSE — lands on /nurse)
-- Shared hash documented at top of file (Demo!Pass#2026).
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, created_by)
VALUES
  ('nurse@medtech.mk', '$2b$12$iKKkfqyfbZxtF9UWYS2DOuWtKIxfSH6r9KXcD.JsCJEQQj3vwrXMK',
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

COMMIT;

-- Quick summary
SELECT 'hospitals'        AS tbl, COUNT(*) FROM hospitals
UNION ALL SELECT 'doctors',         COUNT(*) FROM doctors
UNION ALL SELECT 'patients',        COUNT(*) FROM patients
UNION ALL SELECT 'appointments',    COUNT(*) FROM appointments
UNION ALL SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL SELECT 'prescriptions',   COUNT(*) FROM prescriptions
UNION ALL SELECT 'referrals',       COUNT(*) FROM referrals;
