-- Transactional outbox for email delivery.
-- EmailService writes here within the caller's transaction; a scheduler picks
-- up PENDING rows and delivers them via SMTP with automatic retry.

CREATE TABLE email_outbox (
    id          BIGSERIAL    PRIMARY KEY,
    to_address  VARCHAR(255) NOT NULL,
    subject     VARCHAR(500) NOT NULL,
    body        TEXT         NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts    INT          NOT NULL DEFAULT 0,
    last_error  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    sent_at     TIMESTAMPTZ
);

-- Partial index: only un-delivered rows; scheduler query hits this exclusively
CREATE INDEX idx_email_outbox_pending ON email_outbox(created_at)
    WHERE status = 'PENDING';
