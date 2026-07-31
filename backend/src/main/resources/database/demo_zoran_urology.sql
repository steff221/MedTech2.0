-- ---------------------------------------------------------------------------
-- Demo data for Dr. Zoran Perovski — surgical urology specialist.
--
-- Not a Flyway migration (the filename has no V<n>__ prefix, so Flyway ignores
-- it). Apply by hand:
--
--   docker exec -i medtech-postgres psql -U postgres -d medtech \
--     < backend/src/main/resources/database/demo_zoran_urology.sql
--
-- Re-runnable: it clears this doctor's own demo rows first, so running it again
-- refreshes the data instead of duplicating it. Every date is relative to
-- (now() AT TIME ZONE 'Europe/Skopje')::date, so appointments land on "today" whenever it is run.
-- ---------------------------------------------------------------------------

BEGIN;

-- Resolve the doctor once; everything below hangs off this row.
CREATE TEMP TABLE _doc ON COMMIT DROP AS
SELECT d.id AS doctor_id, d.hospital_id
FROM doctors d
WHERE d.license_number = 'DR-ZORAN-URO';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _doc) THEN
    RAISE EXCEPTION 'Doctor DR-ZORAN-URO not found — apply mock_seed.sql first';
  END IF;
END $$;

-- ── Clean previous run (child rows first, FK order) ────────────────────────
-- medical_records cascades into medical_record_events, which is append-only:
-- its immutability trigger aborts the DELETE and takes the whole transaction
-- with it. That is correct for real clinical data — an audit trail must not be
-- erasable — so the guard is lifted only for the span of this demo cleanup and
-- restored immediately. DISABLE TRIGGER is transactional, so an error anywhere
-- below rolls the protection back on.
ALTER TABLE medical_record_events DISABLE TRIGGER trg_medical_record_events_immutable;

DELETE FROM doctor_ratings  WHERE doctor_id IN (SELECT doctor_id FROM _doc);
DELETE FROM prescriptions   WHERE doctor_id IN (SELECT doctor_id FROM _doc);
DELETE FROM medical_records WHERE doctor_id IN (SELECT doctor_id FROM _doc);
DELETE FROM operations      WHERE doctor_id IN (SELECT doctor_id FROM _doc);
DELETE FROM appointments    WHERE doctor_id IN (SELECT doctor_id FROM _doc);

ALTER TABLE medical_record_events ENABLE TRIGGER trg_medical_record_events_immutable;

-- ── Appointments ───────────────────────────────────────────────────────────
-- Spans the last 30 days through next week. Today and tomorrow both get a
-- full clinic list so the doctor dashboard is populated on either day.
--
-- trg_appointments_future_date rejects backdated rows (correct for the API,
-- but demo history needs them). DISABLE TRIGGER is transactional in Postgres,
-- so a failure anywhere below rolls the guard back on with the data.
ALTER TABLE appointments DISABLE TRIGGER trg_appointments_future_date;

INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date,
                          appointment_time, duration_minutes, status,
                          appointment_type, reason, notes, created_by)
SELECT v.patient_id, d.doctor_id, d.hospital_id,
       (now() AT TIME ZONE 'Europe/Skopje')::date + v.day_offset, v.at, v.mins, v.status::appointment_status_enum,
       v.kind::appointment_type_enum, v.reason, v.notes, 'DEMO_SEED'
FROM _doc d
CROSS JOIN (VALUES
  -- today
  (1,  0, TIME '08:30', 30, 'COMPLETED', 'FOLLOW_UP',    'Post-TURP follow-up',                'Voiding improved, flow rate normalised.'),
  (2,  0, TIME '09:15', 30, 'COMPLETED', 'CONSULTATION', 'Recurrent urinary tract infection',  'Urine culture sent.'),
  (3,  0, TIME '11:00', 45, 'SCHEDULED', 'PROCEDURE',    'Flexible cystoscopy',                NULL),
  (4,  0, TIME '13:30', 30, 'SCHEDULED', 'CONSULTATION', 'Elevated PSA — first assessment',    NULL),
  (5,  0, TIME '14:30', 30, 'SCHEDULED', 'VIRTUAL',      'Tele-review of imaging',             NULL),
  -- tomorrow
  (6,  1, TIME '09:00', 30, 'SCHEDULED', 'CONSULTATION', 'Renal colic — follow-up',            NULL),
  (7,  1, TIME '10:30', 45, 'SCHEDULED', 'PROCEDURE',    'Ureteric stent removal',             NULL),
  (8,  1, TIME '12:00', 30, 'SCHEDULED', 'CHECKUP',      'Annual urology review',              NULL),
  -- next week
  (9,  6, TIME '10:00', 30, 'SCHEDULED', 'CONSULTATION', 'Haematuria investigation',           NULL),
  (10, 7, TIME '11:30', 30, 'SCHEDULED', 'FOLLOW_UP',    'Stone clinic review',                NULL),
  -- history
  (1, -28, TIME '09:00', 45, 'COMPLETED', 'PROCEDURE',    'TURP — pre-operative assessment',   'Consented for surgery.'),
  (2, -21, TIME '10:00', 30, 'COMPLETED', 'CONSULTATION', 'Dysuria and frequency',             'Started antibiotics.'),
  (3, -14, TIME '11:00', 30, 'COMPLETED', 'FOLLOW_UP',    'Bladder tumour surveillance',       'No recurrence on cystoscopy.'),
  (4, -10, TIME '08:45', 30, 'COMPLETED', 'CONSULTATION', 'Prostate enlargement',              'Commenced alpha-blocker.'),
  (5,  -7, TIME '12:30', 30, 'NO_SHOW',   'FOLLOW_UP',    'Missed review appointment',         NULL),
  (6,  -5, TIME '13:00', 30, 'CANCELLED', 'CONSULTATION', 'Patient cancelled — rescheduled',   NULL),
  (7,  -3, TIME '09:30', 30, 'COMPLETED', 'CONSULTATION', 'Left renal stone 6 mm',             'Referred for lithotripsy.')
) AS v(patient_id, day_offset, at, mins, status, kind, reason, notes);

ALTER TABLE appointments ENABLE TRIGGER trg_appointments_future_date;

-- ── Medical records (attached to completed visits) ─────────────────────────
INSERT INTO medical_records (patient_id, doctor_id, hospital_id, appointment_id,
                             diagnosis, mkb10_code, clinical_notes, vital_signs,
                             blood_pressure, heart_rate, temperature, weight, height,
                             assessment, plan, created_by)
SELECT a.patient_id, a.doctor_id, a.hospital_id, a.id,
       r.diagnosis, r.mkb10, r.notes,
       jsonb_build_object('bp', r.bp, 'hr', r.hr, 'temp', r.temp),
       r.bp, r.hr, r.temp, r.wt, r.ht, r.assessment, r.plan, 'DEMO_SEED'
FROM appointments a
JOIN _doc d ON d.doctor_id = a.doctor_id
JOIN (VALUES
  ('Post-TURP follow-up',               'Benign prostatic hyperplasia',            'N40',   'Uroflowmetry improved to 18 ml/s. No haematuria.',              '128/78', 74, 36.6, 88.0, 178.0, 'Satisfactory post-operative recovery.',        'Discharge to GP. Review in 6 months.'),
  ('Recurrent urinary tract infection', 'Recurrent cystitis',                      'N30.1', 'Suprapubic tenderness, no fever. Dipstick nitrite positive.',   '124/80', 82, 37.2, 67.0, 165.0, 'Uncomplicated recurrent lower UTI.',           'Nitrofurantoin 5 days, culture-guided review.'),
  ('TURP — pre-operative assessment',   'Benign prostatic hyperplasia',            'N40',   'Prostate 62 g on ultrasound. IPSS 24.',                          '138/86', 78, 36.8, 90.0, 178.0, 'Bladder outflow obstruction, surgical candidate.', 'List for TURP. Stop anticoagulant 5 days pre-op.'),
  ('Dysuria and frequency',             'Acute cystitis',                          'N30.0', 'Dysuria 3 days. No flank pain.',                                '122/76', 80, 37.4, 67.5, 165.0, 'Acute uncomplicated cystitis.',                'Trimethoprim 3 days, increase fluids.'),
  ('Bladder tumour surveillance',       'Follow-up of bladder neoplasm',           'Z08',   'Flexible cystoscopy — bladder mucosa clear.',                   '130/82', 76, 36.5, 81.0, 172.0, 'No evidence of recurrence.',                   'Continue surveillance cystoscopy at 6 months.'),
  ('Prostate enlargement',              'Benign prostatic hyperplasia',            'N40',   'IPSS 18, nocturia twice nightly. PSA 3.1.',                     '134/84', 72, 36.7, 85.0, 175.0, 'Moderate BPH, medical management appropriate.', 'Tamsulosin 0.4 mg nightly. Review in 3 months.'),
  ('Left renal stone 6 mm',             'Calculus of kidney',                      'N20.0', 'CT KUB: 6 mm stone in left renal pelvis. No obstruction.',       '126/79', 84, 36.9, 79.0, 180.0, 'Renal calculus suitable for lithotripsy.',      'Refer for ESWL. Analgesia and fluids meanwhile.')
) AS r(reason, diagnosis, mkb10, notes, bp, hr, temp, wt, ht, assessment, plan)
  ON r.reason = a.reason
WHERE a.status = 'COMPLETED' AND a.created_by = 'DEMO_SEED';

-- ── Prescriptions ──────────────────────────────────────────────────────────
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency,
                           duration_days, quantity, route, instructions,
                           start_date, end_date, status, refills_allowed, refills_used,
                           created_by)
SELECT v.patient_id, d.doctor_id, v.med, v.dose, v.freq, v.days, v.qty,
       v.route::prescription_route_enum, v.instructions,
       (now() AT TIME ZONE 'Europe/Skopje')::date + v.start_off,
       (now() AT TIME ZONE 'Europe/Skopje')::date + v.start_off + v.days,
       v.status::prescription_status_enum, v.refills, 0, 'DEMO_SEED'
FROM _doc d
CROSS JOIN (VALUES
  (4, 'Tamsulosin',     '0.4 mg', 'Once daily at night',   90, 90, 'ORAL', 'Take after the evening meal. May cause dizziness on standing.', -10, 'ACTIVE',    2),
  (2, 'Nitrofurantoin', '100 mg', 'Twice daily',            5, 10, 'ORAL', 'Take with food. Complete the full course.',                       0, 'ACTIVE',    0),
  (1, 'Solifenacin',    '5 mg',   'Once daily',            30, 30, 'ORAL', 'For urgency symptoms after surgery.',                            -7, 'ACTIVE',    1),
  (7, 'Tamsulosin',     '0.4 mg', 'Once daily at night',   30, 30, 'ORAL', 'Aids passage of the ureteric stone.',                            -3, 'ACTIVE',    1),
  (7, 'Diclofenac',     '50 mg',  'Three times daily',      5, 15, 'ORAL', 'For renal colic pain. Take with food.',                          -3, 'ACTIVE',    0),
  (3, 'Ciprofloxacin',  '500 mg', 'Twice daily',            7, 14, 'ORAL', 'Antibiotic cover for cystoscopy.',                              -14, 'COMPLETED', 0),
  (2, 'Trimethoprim',   '200 mg', 'Twice daily',            3,  6, 'ORAL', 'Short course for acute cystitis.',                              -21, 'COMPLETED', 0),
  (1, 'Finasteride',    '5 mg',   'Once daily',            90, 90, 'ORAL', 'Discontinued — replaced by surgical management.',                -28, 'CANCELLED', 0)
) AS v(patient_id, med, dose, freq, days, qty, route, instructions, start_off, status, refills);

-- ── Operations (surgical urology theatre list) ─────────────────────────────
INSERT INTO operations (patient_id, doctor_id, hospital_id, operation_name, mkb10_code,
                        operation_date, operation_time, duration_minutes, operation_room,
                        surgical_team, anesthesia_type, anesthesiologist,
                        pre_operative_notes, intra_operative_notes, post_operative_notes,
                        complications, outcome, status, created_by)
SELECT v.patient_id, d.doctor_id, d.hospital_id, v.name, v.mkb10,
       (now() AT TIME ZONE 'Europe/Skopje')::date + v.day_offset, v.at, v.mins, v.room,
       v.team, v.anaes, v.anaesthetist,
       v.pre, v.intra, v.post, v.compl, v.outcome,
       v.status::operation_status_enum, 'DEMO_SEED'
FROM _doc d
CROSS JOIN (VALUES
  (1, -25, 'Transurethral resection of the prostate (TURP)', 'N40',   '08:00', 75, 'OR-3',
      'Dr. Z. Perovski, Dr. A. Markovska', 'Spinal', 'Dr. I. Angelov',
      'Prostate 62 g. Anticoagulant withheld 5 days.',
      'Resected 38 g of adenoma. Haemostasis achieved.',
      'Three-way catheter with irrigation overnight.',
      'None', 'Successful — symptoms resolved', 'COMPLETED'),
  (3, -14, 'Flexible cystoscopy with biopsy',               'Z08',   '10:30', 30, 'OR-1',
      'Dr. Z. Perovski', 'Local', 'N/A',
      'Surveillance for previous bladder tumour.',
      'Bladder mucosa clear. Random biopsies taken.',
      'Discharged same day.',
      'None', 'Benign histology', 'COMPLETED'),
  (7,   3, 'Extracorporeal shock wave lithotripsy (ESWL)',  'N20.0', '09:00', 45, 'OR-2',
      'Dr. Z. Perovski', 'Sedation', 'Dr. I. Angelov',
      '6 mm left renal pelvic stone. Pre-op bloods normal.',
      NULL, NULL, NULL, NULL, 'SCHEDULED'),
  (4,   8, 'Transurethral resection of the prostate (TURP)', 'N40',   '08:30', 80, 'OR-3',
      'Dr. Z. Perovski, Dr. S. Nikolov', 'Spinal', 'Dr. I. Angelov',
      'Failed medical therapy. Listed for resection.',
      NULL, NULL, NULL, NULL, 'SCHEDULED')
) AS v(patient_id, day_offset, name, mkb10, at, mins, room, team, anaes, anaesthetist,
       pre, intra, post, compl, outcome, status);

-- ── Ratings on completed visits ────────────────────────────────────────────
INSERT INTO doctor_ratings (appointment_id, patient_id, doctor_id, rating, comment)
SELECT a.id, a.patient_id, a.doctor_id, r.stars, r.comment
FROM appointments a
JOIN _doc d ON d.doctor_id = a.doctor_id
JOIN (VALUES
  ('TURP — pre-operative assessment', 5, 'Explained the operation clearly and answered every question.'),
  ('Dysuria and frequency',           5, 'Seen quickly and treated effectively.'),
  ('Bladder tumour surveillance',     4, 'Thorough and reassuring follow-up.'),
  ('Prostate enlargement',            5, 'Excellent specialist — very professional.'),
  ('Left renal stone 6 mm',           4, 'Clear plan for the stone treatment.')
) AS r(reason, stars, comment) ON r.reason = a.reason
WHERE a.status = 'COMPLETED' AND a.created_by = 'DEMO_SEED';

COMMIT;

-- ── Summary ────────────────────────────────────────────────────────────────
SELECT 'appointments'    AS entity, count(*) FROM appointments    WHERE created_by = 'DEMO_SEED'
UNION ALL SELECT 'appts today',   count(*) FROM appointments    WHERE created_by = 'DEMO_SEED' AND appointment_date = (now() AT TIME ZONE 'Europe/Skopje')::date
UNION ALL SELECT 'appts tomorrow',count(*) FROM appointments    WHERE created_by = 'DEMO_SEED' AND appointment_date = (now() AT TIME ZONE 'Europe/Skopje')::date + 1
UNION ALL SELECT 'records',       count(*) FROM medical_records  WHERE created_by = 'DEMO_SEED'
UNION ALL SELECT 'prescriptions', count(*) FROM prescriptions    WHERE created_by = 'DEMO_SEED'
UNION ALL SELECT 'operations',    count(*) FROM operations       WHERE created_by = 'DEMO_SEED'
UNION ALL SELECT 'ratings',       count(*) FROM doctor_ratings
   WHERE doctor_id = (SELECT id FROM doctors WHERE license_number = 'DR-ZORAN-URO');
