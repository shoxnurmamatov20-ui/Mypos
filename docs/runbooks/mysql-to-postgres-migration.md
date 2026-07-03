# Runbook — MySQL → PostgreSQL data migration (ADR-0006)

One-off bridge that moves all domain data from the ADR-0005-era MySQL
database into PostgreSQL 18. Idempotent when run with `--truncate`.

## Preconditions

- PostgreSQL 18 reachable and migrated: `php artisan migrate --force`
  (this builds the schema, RLS policies, indexes and the `mypos_app` role).
- The target connection user must be the schema owner or a superuser —
  the copy runs under `SET session_replication_role = replica` to make
  FK ordering irrelevant.
- Legacy MySQL reachable via the `LEGACY_DB_*` env vars (the `mysql`
  connection in `config/database.php`):

```env
LEGACY_DB_HOST=127.0.0.1
LEGACY_DB_PORT=3306
LEGACY_DB_DATABASE=mypos
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=
```

## Procedure

```bash
cd apps/api

# 1. Preview the plan — tables and row counts, zero writes.
php artisan db:migrate-from-mysql --dry-run

# 2. Stop writers (maintenance mode on the old stack).
php artisan down   # on the legacy deployment

# 3. Copy. --truncate clears target tables first so re-runs are safe.
php artisan db:migrate-from-mysql --truncate

# 4. The command re-syncs identity sequences and prints a per-table
#    row-count verification. All tables must report matching counts.

# 5. Smoke-check, then point runtimes at Postgres and lift maintenance.
php artisan migrate:status
php artisan up
```

## What is intentionally NOT copied

`migrations`, `cache*`, `sessions`, `jobs`/`job_batches`/`failed_jobs`,
`password_reset_tokens`, `personal_access_tokens` — ephemeral or
schema-bookkeeping tables that regenerate at runtime. Users re-authenticate
(Sanctum tokens are not carried over) — announce that in the release notes.

## Partial copies

Copy a subset (e.g. to rehearse the biggest tables):

```bash
php artisan db:migrate-from-mysql --tables=orders,order_items --truncate
```

## Failure handling

- The command never disables constraints permanently: `replica` mode is
  reset in a `finally` block even when a table fails mid-copy.
- On a row-count MISMATCH warning: re-run with `--truncate --tables=<t>`;
  if it persists, diff `SELECT COUNT(*)` on both sides and check for rows
  rejected by Postgres type strictness (the command coerces tinyint(1) →
  boolean, but genuinely corrupt legacy values — e.g. non-uuid text in a
  uuid column — must be fixed at the source first).

## Local note (2026-07-02)

The local working copy had no `.env`/`vendor` and its XAMPP MySQL data
directory contained no `mypos` schema rows worth carrying — local dev was
re-seeded fresh on PostgreSQL (`php artisan migrate:fresh --seed`). The
bridge exists for any environment that does hold real MySQL data
(e.g. staging/production snapshots).
