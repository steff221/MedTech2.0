-- V105 — ФЗОМ referral forms.
--
-- The referral feature issued a generic document. To print an official ФЗОМ
-- form (Образец СУ / ЛУ-1 / ЛУ-2 / РДУ-1 / РДУ-2 / БУ) three things are needed
-- that the schema did not carry:
--
--   1. Patient identity as the forms demand it — ЕМБГ and ЕЗБО. Both are PHI
--      and are encrypted by PhiStringConverter, so they are TEXT rather than
--      length-bounded (see V102 for why ciphertext cannot sit in a VARCHAR(13)).
--   2. The issuing doctor's факсимил, which every form requires beside the
--      signature. It is a professional identifier, not PHI — left VARCHAR.
--   3. Per-referral form metadata: which concrete ФЗОМ form was issued, plus
--      the ward/journal boxes, the cancellation trail and the print trail.
--
-- The ФЗОМ form code is stored on the row rather than derived at read time.
-- The -1/-2 variant depends on the issuing doctor's role, and a doctor's role
-- can change; deriving it later would silently rewrite documents that have
-- already been printed and handed to a patient.

-- ── 1. Patient identity ──────────────────────────────────────────────────────
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS embg TEXT,
    ADD COLUMN IF NOT EXISTS ezbo TEXT;

COMMENT ON COLUMN patients.embg IS 'ЕМБГ — encrypted at rest via PhiStringConverter';
COMMENT ON COLUMN patients.ezbo IS 'ЕЗБО — encrypted at rest via PhiStringConverter';

-- ── 2. Doctor facsimile ──────────────────────────────────────────────────────
ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS facsimile_number VARCHAR(20);

COMMENT ON COLUMN doctors.facsimile_number IS 'Факсимил — printed beside the signature on every ФЗОМ form';

-- ── 3. Referral type: 5 invented values → 4 clinical intents ─────────────────
-- PostgreSQL cannot drop a value from an enum, so the type is rebuilt and the
-- existing rows are remapped. GENERAL_MEDICINE and SPECIALIST both described a
-- referral to a specialist examination (Образец СУ); DIAGNOSTICS was imaging.
ALTER TYPE referral_type_enum RENAME TO referral_type_enum_old;

CREATE TYPE referral_type_enum AS ENUM (
    'SPECIALIST_EXAM',
    'LABORATORY',
    'RADIOLOGY',
    'HOSPITAL'
);

ALTER TABLE referrals
    ALTER COLUMN referral_type TYPE referral_type_enum
    USING (
        CASE referral_type::text
            WHEN 'GENERAL_MEDICINE' THEN 'SPECIALIST_EXAM'
            WHEN 'SPECIALIST'       THEN 'SPECIALIST_EXAM'
            WHEN 'DIAGNOSTICS'      THEN 'RADIOLOGY'
            WHEN 'LABORATORY'       THEN 'LABORATORY'
            WHEN 'HOSPITAL'         THEN 'HOSPITAL'
        END
    )::referral_type_enum;

DROP TYPE referral_type_enum_old;

-- ── 4. Form metadata, cancellation trail, print trail ───────────────────────
ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS fzom_form_code      VARCHAR(10),
    ADD COLUMN IF NOT EXISTS ward_unit           VARCHAR(200),
    ADD COLUMN IF NOT EXISTS medical_journal_no  VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_by        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS printed_at          TIMESTAMPTZ;

COMMENT ON COLUMN referrals.fzom_form_code IS 'Resolved ФЗОМ form: СУ, ЛУ-1, ЛУ-2, РДУ-1, РДУ-2, БУ';
COMMENT ON COLUMN referrals.printed_at IS 'First time the document was printed; drives the reprint rule';

-- Backfill the form code for rows issued before this migration. The issuing
-- doctor's role is not recorded historically, so the -1/-2 variant cannot be
-- reconstructed; those rows get the base code and are treated as legacy.
UPDATE referrals SET fzom_form_code =
    CASE referral_type::text
        WHEN 'SPECIALIST_EXAM' THEN 'СУ'
        WHEN 'LABORATORY'      THEN 'ЛУ-1'
        WHEN 'RADIOLOGY'       THEN 'РДУ-1'
        WHEN 'HOSPITAL'        THEN 'БУ'
    END
WHERE fzom_form_code IS NULL;

-- A cancelled referral must always say why. Enforced for new cancellations
-- only: rows cancelled before this migration have no recorded reason.
ALTER TABLE referrals
    ADD CONSTRAINT chk_referrals_cancel_reason
    CHECK (status <> 'CANCELLED' OR cancelled_at IS NULL OR cancellation_reason IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_referrals_form_code ON referrals(fzom_form_code);
