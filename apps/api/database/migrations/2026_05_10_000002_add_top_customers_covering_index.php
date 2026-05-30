<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * OPT-A (2026-05-10): top-customers query was the only hot path doing
 * `Using filesort + Using temporary` on the order table — full scan + sort
 * to compute `GROUP BY customer_id ORDER BY SUM(total_amount) DESC`.
 *
 * Add a covering index `(tenant_id, customer_id, total_amount)` so the
 * planner can stream the GROUP BY in index order and the SUM aggregation
 * uses only the index pages — no temp table, no filesort.
 *
 * NO-OP on Postgres — the index would also help on PG but is added here
 * specifically for the MySQL 8.4 production deployment (ADR-0005).
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            return;
        }
        if (! Schema::hasTable('orders')) {
            return;
        }

        $exists = DB::selectOne(
            "SELECT 1 AS x FROM INFORMATION_SCHEMA.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' "
            . "AND INDEX_NAME = 'orders_top_customers_idx' LIMIT 1"
        );
        if ($exists) {
            return;
        }

        Schema::table('orders', function (Blueprint $t): void {
            // Composite covering index for the "top customers by spend" query:
            //   WHERE tenant_id = ? GROUP BY customer_id ORDER BY SUM(total_amount) DESC
            // The leading `tenant_id` matches the WHERE; `customer_id` matches
            // the GROUP BY (already in index order); `total_amount` is the
            // aggregated column (read from the leaf page, no row dive).
            $t->index(
                ['tenant_id', 'customer_id', 'total_amount'],
                'orders_top_customers_idx'
            );
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            return;
        }
        if (! Schema::hasTable('orders')) {
            return;
        }

        $exists = DB::selectOne(
            "SELECT 1 AS x FROM INFORMATION_SCHEMA.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' "
            . "AND INDEX_NAME = 'orders_top_customers_idx' LIMIT 1"
        );
        if (! $exists) {
            return;
        }

        Schema::table('orders', function (Blueprint $t): void {
            $t->dropIndex('orders_top_customers_idx');
        });
    }
};
