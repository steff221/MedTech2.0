-- Persisted refresh tokens for server-side revocation (logout, password change, account lock).
-- Tokens are stored as SHA-256 hashes; the raw JWT never touches the DB.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(64)  NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    revoked       BOOLEAN      NOT NULL DEFAULT FALSE,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_user_id    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_token_hash ON refresh_tokens(token_hash);
-- Partial index so expiry/revocation cleanup scans only live tokens.
CREATE INDEX IF NOT EXISTS idx_rt_active     ON refresh_tokens(expires_at) WHERE revoked = FALSE;

ANALYZE refresh_tokens;
