# ADR-0006: Return to PostgreSQL (18.x) — reverses ADR-0005

- **Status:** Accepted
- **Date:** 2026-07-02
- **Deciders:** Solo Founder
- **Reverses:** ADR-0005 (MySQL 8.4 after revert)
- **Reinstates:** the direction of ADR-0003 (PostgreSQL over MySQL), now on PostgreSQL 18

## Context

ADR-0005 (2026-05-10) moved MyPOS to MySQL 8.4 for XAMPP/phpMyAdmin
familiarity, accepting the loss of RLS, declarative partitioning, partial
indexes and JSONB. Two months of growth later the trade-offs invert:

- The platform is heading for high-scale multi-tenant production use; a
  single app-layer guard (`BelongsToTenant`) for tenant isolation is one
  `withoutGlobalScopes()` bug away from a cross-tenant leak.
- Hot telemetry tables (courier_locations at ~8.6M rows/day design load)
  need partition-drop retention, not DELETE bloat.
- The MySQL-era code kept every Postgres migration and driver branch alive
  behind `if (driver !== 'pgsql')` guards — the rollback path ADR-0005
  explicitly promised. The cost of returning is one config flip plus fixes,
  not a rewrite.
- Porting to Postgres immediately surfaced silent MySQL data-integrity bugs
  (bigint user ids stored in uuid CHAR(36) columns, `MAX()` misuse over
  uuid/json aggregates) — evidence that the stricter type system pays for
  itself.

## Decision

**PostgreSQL 18.x** is the primary database for local development, CI and
production (UZCLOUD primary + Beeline DR). MySQL support is retained ONLY as
the read-side of the one-off data bridge (`php artisan db:migrate-from-mysql`,
`LEGACY_DB_*` env vars).

## What returning bought back

| Capability | Where it is used now |
|---|---|
| Row-Level Security | Layer-2 tenant isolation on every tenant-scoped table (`2026_05_01_000001` + `2026_07_21_000001`) |
| Declarative partitioning | `courier_locations` monthly partitions + O(ms) retention drops |
| Partial indexes | debtors (`payment_status <> paid`), low-stock, menu-browse, primary-domain uniqueness |
| Covering (INCLUDE) indexes | top-customers aggregation index-only scans |
| JSONB | all translatable/i18n columns and metadata (json columns auto-upgraded) |
| `ANY_VALUE` (PG 16+) | group-dependent report columns (also valid MySQL 8 syntax) |

## Tenant isolation — two layers again

1. **App layer** — `BelongsToTenant` global scope, fail-closed (unchanged).
2. **Database layer** — RLS policies keyed on the `app.current_tenant_id`
   GUC set by `SetTenantContext`:
   - tenant users → their tenant uuid
   - super admins → literal `'*'` (written to the DB GUC only; app-side
     metadata never sees `'*'` — Audit H-4 stands)
   - unauthenticated → GUC unset ⇒ policies deny by default

### Runtime roles

RLS does not bind for table owners or superusers. The role model:

| Role | Attributes | Used by |
|---|---|---|
| owner/migrator (e.g. `postgres`) | owns schema | migrations, seeds, queue workers, scheduler, console |
| `mypos_app` | NOLOGIN shell in dev; `LOGIN NOBYPASSRLS` in prod (`infra/scripts/pg-app-role.sql`) | web/API runtime in production; `SET ROLE mypos_app` in the RLS test-suite |

Queue workers stay on the owner role deliberately: jobs process cross-tenant
work without a request-scoped GUC. Their payloads carry explicit tenant ids
and the app-layer scope still applies.

**Known limitation (future work):** the CEO panel reads across the caller's
*owned* tenant set with no GUC. Under the strict policies that surface must
run on the owner role — or the policies must learn a CSV-of-uuids GUC
(`tenant_id = ANY(string_to_array(...))`). Tracked, not blocking: web runtime
rollout as `mypos_app` can gate `/api/v1/ceo/*` until then. `visit_tokens`
and `staff_pin_attempts` use the relaxed empty-GUC-allowed policy because
their public flows must resolve rows pre-auth; `tenants`, `users`,
`tenant_owners` stay RLS-free (login/ownership resolution runs pre-GUC).

## Postgres-specific hardening added with this ADR

- **FK auto-index sweep** — InnoDB indexes FK columns implicitly, Postgres
  does not; `2026_07_21_000002` finds every uncovered FK in `pg_constraint`
  and creates `<table>_<col>_fkauto_idx`.
- **json → jsonb sweep** — Laravel's `json()` maps to plain `json` on PG.
- **PDO options** — `application_name=mypos-api` for pg_stat_activity
  attribution; opt-in `Pdo\Pgsql::ATTR_DISABLE_PREPARES` for PgBouncer
  transaction pooling; opt-in persistent connections.
- **`ANY_VALUE`** replaces the MySQL `MAX()`-as-any-value trick in reports.
- **uuid input guards** — `Str::isUuid()` before every attacker-controlled
  id lookup (payment webhooks); PG raises SQLSTATE 22P02 where MySQL's
  CHAR(36) compared loosely.

## Local development

Three equivalent options (pick one, set `DB_HOST`/`DB_PORT`):

1. `pnpm docker:up` → postgres:18 container on **55432**
2. Native PostgreSQL service on **5432**
3. `infra/scripts/dev-postgres.ps1` → trust-auth cluster on **5433**
   (no password, loopback only — what CI-less Windows dev uses)

## CI

`ci.yml` runs the API job against a `postgres:18` service container
(`pdo_pgsql` extension). `ci-e2e.yml` boots the compose `postgres` service.

## Data migration from the MySQL period

`php artisan db:migrate-from-mysql` — chunked cursor copy of every
overlapping domain table, boolean coercion, FK-order-free via
`session_replication_role=replica`, sequence re-sync, per-table row-count
verification. Runbook: `docs/runbooks/mysql-to-postgres-migration.md`.

## Rollback path

Same discipline ADR-0005 kept: MySQL-gated migrations remain in-tree, the
`mysql` connection block stays in `config/database.php` (as `LEGACY_DB_*`),
and every raw-SQL call site keeps its driver branch. Reversing this ADR is a
config flip plus a reverse data bridge — but the partition/RLS/index features
above would be lost again.
