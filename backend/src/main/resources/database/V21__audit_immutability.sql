-- ============================================================================
-- V21: Enforce append-only audit trails at the database level.
--
-- HIPAA's audit-controls rule (45 CFR §164.312(b)) requires the audit trail
-- to be tamper-evident. Until now audit_logs and medical_record_events were
-- append-only by convention; this migration makes the database reject
-- UPDATE and DELETE outright, so even a compromised application credential
-- cannot rewrite history.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_block_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Sole carve-out: fk_audit_logs_users is ON DELETE SET NULL, so deleting
    -- a user UPDATEs audit rows by nulling user_id. Permit exactly that —
    -- user_id becoming NULL with every other column unchanged.
    -- (JSON access instead of NEW.user_id so the same function also serves
    -- tables without a user_id column.)
    IF TG_OP = 'UPDATE'
       AND TG_TABLE_NAME = 'audit_logs'
       AND (to_jsonb(NEW) ->> 'user_id') IS NULL
       AND (to_jsonb(OLD) ->> 'user_id') IS NOT NULL
       AND (to_jsonb(NEW) - 'user_id') = (to_jsonb(OLD) - 'user_id') THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION '% is append-only: % is not permitted', TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'raise_exception';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_mutation();

-- medical_record_events has no user_id FK, so the carve-out never matches
-- and every UPDATE/DELETE is rejected.
CREATE TRIGGER trg_medical_record_events_immutable
    BEFORE UPDATE OR DELETE ON medical_record_events
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_mutation();
