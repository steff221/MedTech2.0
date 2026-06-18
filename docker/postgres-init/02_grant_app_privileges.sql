-- ============================================================================
-- Runs after the schema (01_) and seed (02_) scripts.  The 03_ prefix
-- guarantees this runs last in the initdb sequence.
--
-- Grants DML-only access to medtech_rw (and therefore medtech_app) on every
-- table and sequence created by the superuser.
-- ============================================================================

-- Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medtech_rw;

-- Sequences (required for GENERATED ALWAYS AS IDENTITY columns on INSERT)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO medtech_rw;

-- Future objects: anything the superuser creates later in a migration
-- automatically grants to medtech_rw.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO medtech_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO medtech_rw;
