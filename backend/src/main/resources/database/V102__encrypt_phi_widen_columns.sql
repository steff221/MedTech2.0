-- V102 — Application-level PHI encryption at rest.
--
-- Free-text PHI columns are now encrypted by the application (AES-256-GCM) via
-- PhiStringConverter. Ciphertext is stored as `enc:v1:<base64>` and is markedly
-- larger than the plaintext, so any length-bounded column must be widened to
-- TEXT. All other encrypted columns (clinical_notes, assessment, plan,
-- allergies, chronic_conditions) are already TEXT.
--
-- No data is transformed here: PhiCryptoService.decrypt() reads any pre-existing
-- plaintext transparently, and rows are re-written as ciphertext on next update.
-- A one-off backfill (re-save each row) can be run later if immediate coverage
-- of legacy rows is required.

-- vw_patient_medical_history (created by the baseline schema) selects
-- mr.diagnosis, and PostgreSQL refuses ALTER TYPE on a column a view depends
-- on — so drop it, widen the column, and recreate it verbatim.
DROP VIEW IF EXISTS vw_patient_medical_history;

ALTER TABLE medical_records
    ALTER COLUMN diagnosis TYPE TEXT;

CREATE OR REPLACE VIEW vw_patient_medical_history AS
SELECT
    mr.id,
    p.id                                              AS patient_id,
    u.first_name     || ' ' || u.last_name            AS patient_name,
    d.specialization,
    u_doc.first_name || ' ' || u_doc.last_name        AS doctor_name,
    mr.diagnosis,
    mr.mkb10_code,
    mr.created_at                                     AS visit_date,
    mr.is_confidential
FROM medical_records mr
JOIN patients p     ON mr.patient_id = p.id
JOIN users    u     ON p.user_id     = u.id
JOIN doctors  d     ON mr.doctor_id  = d.id
JOIN users    u_doc ON d.user_id     = u_doc.id;
