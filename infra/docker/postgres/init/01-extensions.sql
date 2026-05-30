-- ────────────────────────────────────────────────────────────────────────
-- ARCHIVED 2026-05-10 (ADR-0005): Project switched to MySQL 8.4.
-- This file is no longer mounted into any container. Kept for the rollback
-- path documented in ADR-0005 — if Postgres is restored, re-mount via
-- docker-compose.yml `./docker/postgres/init:/docker-entrypoint-initdb.d:ro`.
-- ────────────────────────────────────────────────────────────────────────

-- PostgreSQL extensions enabled for MyPOS.
-- Runs automatically when volume is empty (first-time setup).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- postgis is bigger; enable only when delivery features land (P2+):
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Session setting for tenant isolation (RLS).
-- Laravel middleware will SET this per request.
ALTER DATABASE mypos SET app.current_tenant_id = '';
