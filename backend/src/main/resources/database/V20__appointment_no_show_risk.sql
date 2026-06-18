-- Phase 1 of the ML anomaly-intelligence integration.
-- Stores the no-show risk produced by the ML scoring service at booking time.
-- Both columns are NULLable: NULL means "not scored" (service disabled, down, or
-- pre-existing rows), so the UI can distinguish "no risk data" from "low risk".
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS no_show_risk      DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS no_show_risk_band VARCHAR(10);

COMMENT ON COLUMN appointments.no_show_risk      IS 'No-show probability 0..1 from the ML scoring service; NULL = not scored.';
COMMENT ON COLUMN appointments.no_show_risk_band IS 'LOW / MEDIUM / HIGH band echoed by the scoring service.';
