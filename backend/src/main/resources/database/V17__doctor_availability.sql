-- Doctor weekly availability schedule.
-- One row per (doctor, day_of_week). day_of_week follows ISO-8601: 1=Monday … 7=Sunday.
CREATE TABLE doctor_availability (
    id          BIGSERIAL   PRIMARY KEY,
    doctor_id   BIGINT      NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (doctor_id, day_of_week),
    CONSTRAINT chk_availability_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_doctor_availability_doctor ON doctor_availability(doctor_id);
