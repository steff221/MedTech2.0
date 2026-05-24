-- Email verification tokens. Users must verify their email before full access.
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_user_id    ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_evt_expires    ON email_verification_tokens(expires_at) WHERE used = FALSE;

-- Add email_verified flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ANALYZE email_verification_tokens;
