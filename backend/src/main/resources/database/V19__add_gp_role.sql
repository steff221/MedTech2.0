-- Add GENERAL_PRACTITIONER to user_role_enum for the family doctor / GP portal.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL,
-- so we guard with a DO block that checks before altering.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'GENERAL_PRACTITIONER'
          AND enumtypid = 'user_role_enum'::regtype
    ) THEN
        ALTER TYPE user_role_enum ADD VALUE 'GENERAL_PRACTITIONER';
    END IF;
END$$;
