<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit M12: `notifications_log` has no retention policy.
 *
 * The create migration added two composites:
 *   - (tenant_id, channel, status)
 *   - (tenant_id, created_at)
 *
 * Both lead with `tenant_id`. Neither helps a global retention sweep:
 *
 *     DELETE FROM notifications_log WHERE created_at < NOW() - INTERVAL '90 days';
 *
 * That query is tenant-agnostic, runs in a maintenance window with no
 * tenant GUC, and currently degrades to a sequential scan as the table
 * grows. Adding a plain (created_at) index makes the DELETE an index-
 * range scan — O(deleted rows) instead of O(table size).
 *
 * Why not a partial index `WHERE created_at < NOW() - INTERVAL '90 days'`?
 * Because NOW() is STABLE, not IMMUTABLE — PG forbids it in index
 * predicates. A static cutoff would go stale immediately. A plain btree
 * is the right call here.
 *
 * Retention job (NOT scheduled by this migration — wire up in
 * `app/Console/Kernel.php` or via Laravel scheduler):
 *
 *     // Daily, at 03:00 UTC, in batches of 10k to avoid lock storms:
 *     DELETE FROM notifications_log
 *      WHERE id IN (
 *          SELECT id FROM notifications_log
 *           WHERE created_at < NOW() - INTERVAL '90 days'
 *           LIMIT 10000
 *      );
 *
 * NO-OP on sqlite/mysql.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('notifications_log')) {
            return;
        }

        DB::statement(
            'CREATE INDEX IF NOT EXISTS notifications_log_retention_idx '
            . 'ON notifications_log (created_at)'
        );
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('notifications_log')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS notifications_log_retention_idx');
    }
};
