-- Pre-operative diagnosis (WHO ICD-10 / MKB-10 code) for surgical operations.
-- Validated server-side against the bundled WHO ICD-10 2019 catalog.
ALTER TABLE operations
    ADD COLUMN mkb10_code VARCHAR(10);

COMMENT ON COLUMN operations.mkb10_code IS 'WHO ICD-10 (MKB-10) code of the pre-operative diagnosis, e.g. K35.8';
