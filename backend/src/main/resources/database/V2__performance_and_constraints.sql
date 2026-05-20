-- ============================================================================
-- MedTech V2 Migration — Performance indexes, constraints, and audit triggers
-- Run after V1 (medtech_schema_pg.sql) is fully applied.
-- All operations are additive/non-breaking: new indexes, triggers, constraints
-- on nullable or defaulted columns only.
-- ============================================================================

-- ============================================================================
-- 1. PARTIAL INDEX: active/scheduled appointments only
--    Dramatically reduces index size for the most common query pattern.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_doctor
    ON appointments(doctor_id, appointment_date)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_patient
    ON appointments(patient_id, appointment_date)
    WHERE status = 'SCHEDULED';

-- ============================================================================
-- 2. UNIQUE CONSTRAINT: one appointment per doctor per date+time slot
--    Prevents duplicate bookings at the database level (belt-and-suspenders
--    alongside the pessimistic-lock check in AppointmentService).
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_appointments_doctor_slot'
    ) THEN
        ALTER TABLE appointments
            ADD CONSTRAINT uq_appointments_doctor_slot
            UNIQUE (doctor_id, appointment_date, appointment_time)
            DEFERRABLE INITIALLY DEFERRED;
    END IF;
END;
$$;

-- ============================================================================
-- 3. TRIGGER: reject appointments booked in the past (INSERT only)
--    Enforces temporal validity at the DB layer, supplementing application
--    validation in AppointmentService.book().
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_appointments_future_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'appointment_date must not be in the past (got %)', NEW.appointment_date
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_future_date ON appointments;
CREATE TRIGGER trg_appointments_future_date
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION fn_appointments_future_date();

-- ============================================================================
-- 4. PARTIAL INDEX: active prescriptions per patient (common dashboard query)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_active
    ON prescriptions(patient_id, start_date DESC)
    WHERE status = 'ACTIVE';

-- ============================================================================
-- 5. PARTIAL INDEX: active doctors (used by directory search)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_doctors_active_spec
    ON doctors(specialization, hospital_id)
    WHERE status = 'ACTIVE';

-- ============================================================================
-- 6. FK integrity: ensure medical records cannot be hard-deleted when
--    appointments reference them (already handled by ON DELETE RESTRICT on
--    the FK — this comment documents the intent for future migrations).
-- ============================================================================

-- ============================================================================
-- 7. ROW-LEVEL audit: medical_records INSERT/UPDATE
--    Supplements the application-level AuditLogService with a DB-side safety net.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_medical_records_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, new_values)
        VALUES ('INSERT', 'MEDICAL_RECORDS', NEW.id,
                jsonb_build_object(
                    'patient_id', NEW.patient_id,
                    'doctor_id',  NEW.doctor_id,
                    'mkb10_code', NEW.mkb10_code,
                    'is_confidential', NEW.is_confidential
                ));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action_type, entity_type, entity_id, old_values, new_values)
        VALUES ('UPDATE', 'MEDICAL_RECORDS', NEW.id,
                jsonb_build_object('diagnosis', OLD.diagnosis, 'mkb10_code', OLD.mkb10_code),
                jsonb_build_object('diagnosis', NEW.diagnosis, 'mkb10_code', NEW.mkb10_code));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medical_records_audit ON medical_records;
CREATE TRIGGER trg_medical_records_audit
    AFTER INSERT OR UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION fn_medical_records_audit();

-- ============================================================================
-- 8. Refresh planner statistics after schema changes
-- ============================================================================
ANALYZE appointments;
ANALYZE prescriptions;
ANALYZE doctors;
ANALYZE medical_records;
