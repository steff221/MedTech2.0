-- ============================================================================
-- V99: De-duplicate doctor appointment slots and make the uniqueness
--      guarantee un-bypassable.
--
-- WHY V99 (not V22): the mock seed is V98 and runs BEFORE this file both on
-- fresh installs (version order) and in the existing DB (V98 is the highest
-- applied version, out-of-order is disabled). The seed does
-- `ALTER TABLE appointments DISABLE TRIGGER ALL` around its bulk insert, which
-- also disables the internal check trigger of the DEFERRABLE
-- `uq_appointments_doctor_slot` constraint — so duplicate (doctor, date, time)
-- rows were committed straight into the index. This migration must therefore
-- run AFTER the seed to clean up and then harden the constraint.
--
-- Fix: repoint dependent rows off the duplicates, delete the duplicates
-- (keeping the lowest id per slot), then re-create the constraint as
-- NOT DEFERRABLE so `DISABLE TRIGGER ALL` can never bypass it again.
--
-- Idempotent: re-running is a no-op (no duplicates left, constraint already
-- immediate).
-- ============================================================================

-- 1. Drop the bypassable DEFERRABLE constraint (only if it is still deferrable).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_appointments_doctor_slot'
          AND conrelid = 'appointments'::regclass
          AND condeferrable
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT uq_appointments_doctor_slot;
    END IF;
END$$;

-- 2. Repoint medical_records that point at a duplicate row to the surviving
--    (lowest-id) row for that slot. (No doctor_ratings reference duplicates.)
WITH ranked AS (
    SELECT id,
           min(id) OVER (PARTITION BY doctor_id, appointment_date, appointment_time) AS keeper_id
    FROM appointments
)
UPDATE medical_records m
SET appointment_id = r.keeper_id
FROM ranked r
WHERE m.appointment_id = r.id
  AND r.id <> r.keeper_id;

-- 3. Delete the duplicate appointment rows, keeping the lowest id per slot.
DELETE FROM appointments a
USING (
    SELECT id,
           row_number() OVER (PARTITION BY doctor_id, appointment_date, appointment_time
                              ORDER BY id) AS rn
    FROM appointments
) d
WHERE a.id = d.id
  AND d.rn > 1;

-- 4. Re-create the constraint as NOT DEFERRABLE (enforced directly by the
--    unique index insert — cannot be bypassed by disabling triggers).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_appointments_doctor_slot'
          AND conrelid = 'appointments'::regclass
    ) THEN
        ALTER TABLE appointments
            ADD CONSTRAINT uq_appointments_doctor_slot
            UNIQUE (doctor_id, appointment_date, appointment_time);
    END IF;
END$$;

ANALYZE appointments;
