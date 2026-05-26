-- Referral type and status enums
CREATE TYPE referral_type_enum AS ENUM (
    'GENERAL_MEDICINE',
    'SPECIALIST',
    'LABORATORY',
    'DIAGNOSTICS',
    'HOSPITAL'
);

CREATE TYPE referral_status_enum AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE referrals (
    id               BIGSERIAL PRIMARY KEY,
    referral_number  VARCHAR(20)  NOT NULL,
    doctor_id        BIGINT       NOT NULL REFERENCES doctors(id),
    patient_id       BIGINT       NOT NULL REFERENCES patients(id),
    referral_type    referral_type_enum   NOT NULL,
    referred_to      VARCHAR(200) NOT NULL,
    mkb10_code       VARCHAR(20),
    description      TEXT,
    scheduled_date   DATE         NOT NULL,
    status           referral_status_enum NOT NULL DEFAULT 'ACTIVE',
    outcome_note     TEXT,
    outcome_date     DATE,
    created_by       VARCHAR(100),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_referrals_number ON referrals(referral_number);
CREATE INDEX idx_referrals_doctor   ON referrals(doctor_id, status);
CREATE INDEX idx_referrals_patient  ON referrals(patient_id, status);
CREATE INDEX idx_referrals_created  ON referrals(created_at DESC);
