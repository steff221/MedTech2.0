-- Add optimistic-locking version column to refresh_tokens.
-- Hibernate's @Version mechanism uses this to detect concurrent token rotation
-- (two requests both trying to revoke the same refresh token simultaneously).
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
