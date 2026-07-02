-- ============================================================================
-- V101: Domain CHECK constraints (M2).
--
-- Adds value-range validation the schema was missing. All predicates were
-- verified to hold against existing data before authoring, so validation of
-- current rows succeeds. Each constraint is added via a guard so re-running is
-- a no-op (ALTER TABLE ... ADD CONSTRAINT has no IF NOT EXISTS).
-- ============================================================================

CREATE OR REPLACE FUNCTION pg_temp.add_check(p_table regclass, p_name text, p_expr text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = p_name AND conrelid = p_table
    ) THEN
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (%s)', p_table, p_name, p_expr);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- doctors
SELECT pg_temp.add_check('doctors',      'chk_doctors_experience_nonneg', 'experience_years IS NULL OR experience_years >= 0');
SELECT pg_temp.add_check('doctors',      'chk_doctors_fee_nonneg',        'consultation_fee IS NULL OR consultation_fee >= 0');

-- hospitals
SELECT pg_temp.add_check('hospitals',    'chk_hospitals_beds_nonneg',     'bed_count IS NULL OR bed_count >= 0');
SELECT pg_temp.add_check('hospitals',    'chk_hospitals_lat',             'latitude  IS NULL OR latitude  BETWEEN -90  AND 90');
SELECT pg_temp.add_check('hospitals',    'chk_hospitals_lon',             'longitude IS NULL OR longitude BETWEEN -180 AND 180');

-- appointments
SELECT pg_temp.add_check('appointments', 'chk_appt_duration_pos',         'duration_minutes > 0');

-- prescriptions
SELECT pg_temp.add_check('prescriptions','chk_presc_refills',             'refills_allowed >= 0 AND refills_used >= 0 AND refills_used <= refills_allowed');
SELECT pg_temp.add_check('prescriptions','chk_presc_qty',                 'quantity IS NULL OR quantity > 0');
SELECT pg_temp.add_check('prescriptions','chk_presc_duration',            'duration_days IS NULL OR duration_days > 0');

-- medical_records (plausibility ranges for recorded vitals)
SELECT pg_temp.add_check('medical_records','chk_mr_vitals',
       '(heart_rate  IS NULL OR heart_rate BETWEEN 1 AND 400)
    AND (temperature IS NULL OR temperature BETWEEN 25 AND 45)
    AND (weight IS NULL OR weight > 0)
    AND (height IS NULL OR height > 0)');
