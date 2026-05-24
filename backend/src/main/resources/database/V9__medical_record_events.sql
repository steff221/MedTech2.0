-- Append-only audit log for medical records.
-- Every creation and addendum is stored here as an immutable row.
-- The medical_records table holds the current projection for fast reads;
-- this table provides the full history for compliance and correction tracking.

CREATE TABLE medical_record_events (
    id          BIGSERIAL    PRIMARY KEY,
    record_id   BIGINT       NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    event_type  VARCHAR(20)  NOT NULL,   -- 'CREATED' | 'ADDENDUM'
    authored_by BIGINT       NOT NULL REFERENCES users(id),
    snapshot    JSONB        NOT NULL,   -- clinical field snapshot at event time
    note        TEXT,                    -- required for ADDENDUM; explains the change
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_mre_record_id ON medical_record_events(record_id, created_at);
