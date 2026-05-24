-- Add ADMIN role to the user_role enum.
-- PostgreSQL does not support removing enum values, so this is append-only.
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ADMIN';

-- Add a query-friendly index for admin user-listing by role/status.
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

ANALYZE users;
