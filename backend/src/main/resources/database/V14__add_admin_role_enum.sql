-- Add ADMIN to user_role_enum so admin users can be inserted without a DB constraint error.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL,
-- so we guard with a DO block that checks before altering.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ADMIN'
          AND enumtypid = 'user_role_enum'::regtype
    ) THEN
        ALTER TYPE user_role_enum ADD VALUE 'ADMIN';
    END IF;
END$$;
