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

ALTER TABLE medical_records
    ALTER COLUMN diagnosis TYPE TEXT;
