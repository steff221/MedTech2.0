-- Doctor ratings: one rating per completed appointment, authored by the patient.
CREATE TABLE doctor_ratings (
    id              BIGSERIAL       PRIMARY KEY,
    appointment_id  BIGINT          NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id      BIGINT          NOT NULL REFERENCES patients(id)            ON DELETE CASCADE,
    doctor_id       BIGINT          NOT NULL REFERENCES doctors(id)             ON DELETE CASCADE,
    rating          SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_ratings_doctor_id ON doctor_ratings (doctor_id);
CREATE INDEX idx_doctor_ratings_patient_id ON doctor_ratings (patient_id);
