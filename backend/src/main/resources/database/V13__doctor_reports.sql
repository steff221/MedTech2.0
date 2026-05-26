-- Individual (doctor) periodic reports

CREATE TYPE report_period_type_enum AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE report_status_enum       AS ENUM ('DRAFT', 'SUBMITTED');

CREATE TABLE doctor_reports (
    id                 BIGSERIAL PRIMARY KEY,
    doctor_id          BIGINT       NOT NULL REFERENCES doctors(id),
    report_number      VARCHAR(30)  NOT NULL UNIQUE,
    period_type        report_period_type_enum NOT NULL,
    period_label       VARCHAR(50)  NOT NULL,
    period_start       DATE         NOT NULL,
    period_end         DATE         NOT NULL,
    patient_count      INT          NOT NULL DEFAULT 0,
    diagnosis_count    INT          NOT NULL DEFAULT 0,
    appointment_count  INT          NOT NULL DEFAULT 0,
    prescription_count INT          NOT NULL DEFAULT 0,
    status             report_status_enum NOT NULL DEFAULT 'DRAFT',
    submitted_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_reports_doctor    ON doctor_reports(doctor_id);
CREATE INDEX idx_doctor_reports_period    ON doctor_reports(period_start DESC);
CREATE INDEX idx_doctor_reports_status    ON doctor_reports(status);
