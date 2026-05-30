<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * MySQL performance indexes — replacement for the Postgres-only indexes that
 * silently no-op'd on MySQL after ADR-0005 (2026-05-10).
 *
 * Audited gaps (see /docs/adr/0005-mysql-after-revert.md follow-up):
 *
 *   - 2026_05_01_000008_add_compound_indexes_to_orders.php — created composite
 *     `(tenant_id, status, created_at DESC)` and a functional `DATE(created_at)`
 *     index for dashboard bucketing. Both Postgres-gated.
 *
 *   - 2026_05_01_000010_add_retention_metadata_to_notifications_log.php —
 *     created `(created_at)` retention sweep index. Postgres-gated.
 *
 *   - 2026_05_01_000009_audit_logs_index_cleanup.php — dropped a redundant
 *     legacy index. Postgres-gated; safe to skip on MySQL (legacy index never
 *     existed on fresh MySQL installs).
 *
 *   - Audit findings (perf review 2026-05-10) added these MySQL-native gaps:
 *       orders        : (tenant_id, customer_id, created_at DESC)
 *                       (tenant_id, payment_status)
 *       payments      : (tenant_id, created_at DESC)
 *                       (tenant_id, status, created_at DESC)
 *       menu_items    : (tenant_id, stock_tracked, current_stock)  // low-stock dashboard
 *
 * NO-OP on Postgres — the gated migrations already handle that connection.
 *
 * MySQL 8.x supports descending b-tree indexes (8.0+) and functional indexes
 * (8.0.13+); 8.4 LTS has both. Functional index syntax differs from Postgres:
 * MySQL wraps the expression in `((expr))` (double parens, with explicit cast
 * if necessary). For DATE bucketing we use a generated column instead — it's
 * portable, indexable, and doesn't need 8.0.13+ functional support.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            // Postgres path is covered by 2026_05_01_000008/9/10. Nothing to do.
            return;
        }

        // ── orders ────────────────────────────────────────────────────────
        if (Schema::hasTable('orders')) {
            // Compound: dashboard / KDS / kanban filter+sort.
            //   WHERE tenant_id = ? AND status IN (...) ORDER BY created_at DESC
            $this->addIndexIfMissing(
                'orders',
                'orders_tenant_status_created_idx',
                ['tenant_id', 'status', 'created_at']
            );

            // Customer history page.
            //   WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC
            $this->addIndexIfMissing(
                'orders',
                'orders_tenant_customer_created_idx',
                ['tenant_id', 'customer_id', 'created_at']
            );

            // Unpaid-orders dashboard filter.
            //   WHERE tenant_id = ? AND payment_status = ?
            if (Schema::hasColumn('orders', 'payment_status')) {
                $this->addIndexIfMissing(
                    'orders',
                    'orders_tenant_payment_status_idx',
                    ['tenant_id', 'payment_status']
                );
            }

            // Date-bucketed revenue chart. Generated DATE column lets
            // MySQL's planner reuse a btree on a virtual expression.
            if (! Schema::hasColumn('orders', 'created_date')) {
                Schema::table('orders', function (Blueprint $table): void {
                    // Stored generated column — DATE-only projection of created_at.
                    DB::statement(
                        'ALTER TABLE orders ADD COLUMN created_date DATE '
                        . 'GENERATED ALWAYS AS (DATE(created_at)) STORED'
                    );
                });
            }
            $this->addIndexIfMissing(
                'orders',
                'orders_tenant_date_idx',
                ['tenant_id', 'created_date']
            );
        }

        // ── payments ──────────────────────────────────────────────────────
        if (Schema::hasTable('payments')) {
            $this->addIndexIfMissing(
                'payments',
                'payments_tenant_created_idx',
                ['tenant_id', 'created_at']
            );
            $this->addIndexIfMissing(
                'payments',
                'payments_tenant_status_created_idx',
                ['tenant_id', 'status', 'created_at']
            );
        }

        // ── notifications_log ─────────────────────────────────────────────
        // Retention sweep: WHERE created_at < NOW() - INTERVAL N DAY
        if (Schema::hasTable('notifications_log')) {
            $this->addIndexIfMissing(
                'notifications_log',
                'notifications_log_retention_idx',
                ['created_at']
            );
            // Super-admin cross-tenant feed by channel/status.
            $this->addIndexIfMissing(
                'notifications_log',
                'notifications_log_channel_status_created_idx',
                ['channel', 'status', 'created_at']
            );
        }

        // ── menu_items ────────────────────────────────────────────────────
        // Low-stock dashboard:
        //   WHERE tenant_id = ? AND stock_tracked = 1 AND current_stock <= low_stock_threshold
        if (Schema::hasTable('menu_items') && Schema::hasColumn('menu_items', 'stock_tracked')) {
            $this->addIndexIfMissing(
                'menu_items',
                'menu_items_tenant_stock_idx',
                ['tenant_id', 'stock_tracked', 'current_stock']
            );
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            return;
        }

        $this->dropIndexIfExists('orders', 'orders_tenant_status_created_idx');
        $this->dropIndexIfExists('orders', 'orders_tenant_customer_created_idx');
        $this->dropIndexIfExists('orders', 'orders_tenant_payment_status_idx');
        $this->dropIndexIfExists('orders', 'orders_tenant_date_idx');
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'created_date')) {
            DB::statement('ALTER TABLE orders DROP COLUMN created_date');
        }

        $this->dropIndexIfExists('payments', 'payments_tenant_created_idx');
        $this->dropIndexIfExists('payments', 'payments_tenant_status_created_idx');

        $this->dropIndexIfExists('notifications_log', 'notifications_log_retention_idx');
        $this->dropIndexIfExists('notifications_log', 'notifications_log_channel_status_created_idx');

        $this->dropIndexIfExists('menu_items', 'menu_items_tenant_stock_idx');
    }

    /**
     * @param  list<string>  $columns
     */
    private function addIndexIfMissing(string $table, string $name, array $columns): void
    {
        $exists = DB::selectOne(
            "SELECT 1 AS x FROM INFORMATION_SCHEMA.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1",
            [$table, $name]
        );
        if ($exists) {
            return;
        }
        Schema::table($table, function (Blueprint $t) use ($columns, $name): void {
            $t->index($columns, $name);
        });
    }

    private function dropIndexIfExists(string $table, string $name): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }
        $exists = DB::selectOne(
            "SELECT 1 AS x FROM INFORMATION_SCHEMA.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1",
            [$table, $name]
        );
        if (! $exists) {
            return;
        }
        Schema::table($table, function (Blueprint $t) use ($name): void {
            $t->dropIndex($name);
        });
    }
};
