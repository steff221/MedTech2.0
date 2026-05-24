-- Password reset tokens. Raw token never stored — only SHA-256 hash.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_expires    ON password_reset_tokens(expires_at) WHERE used = FALSE;

ANALYZE password_reset_tokens;
