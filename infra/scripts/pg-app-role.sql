-- MyPOS — production runtime role promotion (ADR-0006)
--
-- The migration 2026_07_21_000001_extend_rls_and_create_app_role creates a
-- NOLOGIN shell role `mypos_app` with table/sequence grants and keeps them
-- fresh via default privileges. In production, promote it to the login role
-- the WEB runtime connects as, so Row-Level Security actually binds (table
-- owners and superusers bypass RLS unless FORCE'd).
--
-- Run as a superuser / the database owner, once per environment:
--
--   psql "$DATABASE_URL" -f infra/scripts/pg-app-role.sql \
--        -v app_password='<generate-a-long-random-secret>'
--
-- Then set for the web runtime (Doppler/Coolify):
--   DB_USERNAME=mypos_app
--   DB_PASSWORD=<that secret>
--
-- Keep migrations, queue workers and scheduled jobs on the OWNER role:
-- workers process cross-tenant jobs without a request-scoped GUC, and
-- migrations need DDL. See ADR-0006 "Runtime roles".

ALTER ROLE mypos_app LOGIN PASSWORD :'app_password';

-- Belt-and-braces: the app role must never bypass RLS or own objects.
ALTER ROLE mypos_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- Connection cap so a runaway web pool cannot starve workers/migrations.
ALTER ROLE mypos_app CONNECTION LIMIT 150;
