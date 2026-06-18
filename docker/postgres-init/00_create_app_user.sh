#!/usr/bin/env bash
# =============================================================================
# Runs as the postgres superuser during Docker initdb (before schema/seed).
# Creates medtech_app as a DML-only login role — it cannot DROP or ALTER tables
# because all objects are owned by the superuser.
# =============================================================================
set -euo pipefail

: "${MEDTECH_DB_PASSWORD:?MEDTECH_DB_PASSWORD env var must be set}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    -- DML privilege container (no login)
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'medtech_rw') THEN
            CREATE ROLE medtech_rw NOLOGIN;
        END IF;
    END
    \$\$;

    -- App login role — password injected from env var by the shell
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'medtech_app') THEN
            CREATE ROLE medtech_app LOGIN PASSWORD '$MEDTECH_DB_PASSWORD';
        ELSE
            ALTER ROLE medtech_app PASSWORD '$MEDTECH_DB_PASSWORD';
        END IF;
    END
    \$\$;

    GRANT medtech_rw TO medtech_app;

    -- Lock search_path — prevents schema-injection through untrusted extensions.
    ALTER ROLE medtech_app SET search_path = public;
    ALTER ROLE medtech_rw  SET search_path = public;

    -- Statement timeout: 30 s for regular app queries.
    ALTER ROLE medtech_app SET statement_timeout = '30s';

    GRANT CONNECT ON DATABASE $POSTGRES_DB TO medtech_app;
    GRANT USAGE ON SCHEMA public TO medtech_rw;
SQL
