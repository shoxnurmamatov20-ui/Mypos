# ADR-0005: Switch to MySQL 8.4 (reverses ADR-0003)

- **Status:** **REVERSED** (see ADR-0006, 2026-07-02)
- **Date:** 2026-05-10
- **Deciders:** Solo Founder
- **Reverses:** ADR-0003 (PostgreSQL 17 over MySQL)

> **REVERSAL NOTICE (2026-07-02)**: ADR-0006 moved the project back to
> **PostgreSQL 18** using exactly the rollback path this ADR preserved.
> RLS + partitioning + partial indexes are in effect again; MySQL remains
> only as the `LEGACY_DB_*` read-side of the one-off data bridge.

## Context

ADR-0003 (2026-04-20) selected PostgreSQL 17 for RLS, JSONB, full-text search,
and analytics readiness. After ~3 weeks of development, founder decided to
move to MySQL — the local dev environment uses XAMPP, and team familiarity
with MySQL/phpMyAdmin tooling outweighs the RLS defence-in-depth benefit.

## Decision

**Use MySQL 8.4 LTS** as the primary database for both local development
(via XAMPP) and CI. Production hosting will run MySQL 8.4 on Coolify.

## Trade-offs accepted

| Lost (Postgres-specific) | Mitigation |
|---|---|
| Row-Level Security (RLS) | App-layer `BelongsToTenant` global scope is now the sole tenant guard. The trait is **defensive** — returns `whereRaw('1=0')` if no auth context. |
| `pg_trgm` typo-tolerant search | Meilisearch already handles fuzzy search at the application layer. |
| `unaccent` Cyrillic↔Latin | Meilisearch covers this. |
| JSONB indexed queries | MySQL 8 JSON is slower but functional; Eloquent `->where('col->key', val)` works on both. |
| Array column type | Use JSON arrays (already the Laravel norm). |
| Declarative range partitioning | MySQL `PARTITION BY RANGE (TO_DAYS(col))` — different syntax, same effect. The `partition_courier_locations` migration already no-ops on non-pgsql; can be reimplemented later if courier_locations volume warrants it. |
| `current_setting()` / `SET LOCAL` | `SetTenantContext` middleware becomes app-side metadata only (no DB enforcement). |
| MVCC without read locks | InnoDB row-level locking is acceptable for current load. |

## Consequences

### Positive
- Local dev simpler with XAMPP + phpMyAdmin
- Hosting more ubiquitous if Coolify is replaced
- Familiar tooling for the founder

### Negative
- **Tenant isolation is now a single layer** (app-side). One `withoutGlobalScopes()` call without `SuperAdminScope::unguard()` in raw context = cross-tenant leak. Code review must catch this.
- Existing RLS tests at `tests/Feature/Security/TenantIsolationRlsTest.php` are no longer meaningful — replaced by app-layer scope tests.
- Future "PostGIS for delivery zones" plan now requires MySQL spatial types (less expressive).

### Neutral
- Meilisearch already handles search needs; no functional regression there.
- Filament, Sanctum, Spatie packages, Reverb, Horizon all work identically on MySQL.

## Schema migration strategy

- All 65 existing migrations were authored with `Schema::` builder calls that
  Laravel translates per-driver. The two Postgres-specific migrations
  (`enable_rls_on_tenant_scoped_tables`, `partition_courier_locations`) were
  already wrapped in `if (driver !== 'pgsql') return;` guards, so they no-op
  cleanly on MySQL.
- A fresh `migrate:fresh --seed` against MySQL 8.4 reproduces the schema.

## Local dev setup (after revert)

```
1. Start XAMPP → click "Start" next to MySQL.
2. Open phpMyAdmin (http://localhost/phpmyadmin).
3. Create database `mypos` with utf8mb4_unicode_ci collation.
4. cp apps/api/.env.example apps/api/.env
5. cd apps/api && php artisan migrate --seed
```

No Docker postgres needed. Redis/Meilisearch/MinIO still run via
`pnpm docker:up`.

## CI

GitHub Actions workflows use the official `mysql:8.4` service container.

## Rollback path

If MySQL proves limiting, this ADR can itself be reversed by:
1. Restoring the postgres service to `infra/docker-compose.yml`.
2. Re-pointing `DB_CONNECTION=pgsql` in env.
3. Re-running `enable_rls_on_tenant_scoped_tables` migration (it was preserved).
4. Pointing `SetTenantContext` middleware back at `set_config()`.

The two Postgres-specific migration files were intentionally retained, not
deleted, to keep the rollback option cheap.
