<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit M2 + dashboard table-scan fix.
 *
 * Two new indexes + one redundancy cleanup on `orders`:
 *
 * 1. `orders_tenant_status_created_idx` (tenant_id, status, created_at DESC)
 *    Covers the most-common dashboard / KDS / kanban query:
 *        WHERE tenant_id = ? AND status IN (...) ORDER BY created_at DESC
 *    Existing `(tenant_id, status)` from the create migration only narrows
 *    on equality; the planner still has to sort by created_at on top.
 *    This composite lets the planner do an index-only ordered scan.
 *
 * 2. `orders_tenant_date_idx` (tenant_id, DATE(created_at))
 *    Functional index for {@see DashboardChartsService} which buckets by
 *    `DATE(created_at)`. The naked DATE(...) cast disqualifies the existing
 *    btree on (tenant_id, created_at) — the planner can't reuse it. A
 *    functional expression index makes the GROUP BY / WHERE sargable.
 *
 * 3. Drop `orders_created_at_idx` if it exists. The audit found a single-
 *    column index on `created_at` alone; it is fully covered by every
 *    composite that leads with `(tenant_id, ..., created_at)` plus the new
 *    indexes above. Keeping it just bloats writes.
 *    NOTE: The base create migration registered `(tenant_id, created_at)`
 *    only — Laravel auto-names that `orders_tenant_id_created_at_index`,
 *    NOT `orders_created_at_idx`. The DROP is therefore a defensive no-op
 *    on fresh installs but cleans up legacy environments where it was
 *    added manually. We use IF EXISTS for safety either way.
 *
 * NO-OP on sqlite/mysql: functional indexes need PostgreSQL.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('orders')) {
            return;
        }

        // ── 1. Compound index for status-filtered dashboards ────────────
        DB::statement(
            'CREATE INDEX IF NOT EXISTS orders_tenant_status_created_idx '
            . 'ON orders (tenant_id, status, created_at DESC)'
        );

        // ── 2. Functional index for DATE(created_at) bucketing ──────────
        // Note: DATE() is IMMUTABLE in PG, safe to index.
        DB::statement(
            'CREATE INDEX IF NOT EXISTS orders_tenant_date_idx '
            . 'ON orders (tenant_id, (DATE(created_at)))'
        );

        // ── 3. Drop redundant single-column created_at index if present ─
        DB::statement('DROP INDEX IF EXISTS orders_created_at_idx');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS orders_tenant_date_idx');
        DB::statement('DROP INDEX IF EXISTS orders_tenant_status_created_idx');

        // We do NOT recreate `orders_created_at_idx` in down() because it
        // was a redundant manual add — re-introducing it on rollback would
        // simply re-add the bloat we just removed.
    }
};
