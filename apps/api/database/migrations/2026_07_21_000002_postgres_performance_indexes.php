<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ADR-0006 — PostgreSQL-native performance pass. Three sections:
 *
 * A. FK auto-index sweep.
 *    InnoDB silently indexes every FOREIGN KEY column; PostgreSQL does NOT.
 *    Every FK added during the MySQL period (ADR-0005) therefore arrived on
 *    Postgres without its supporting index — child-side lookups and
 *    ON DELETE CASCADE walks degrade to sequential scans. The sweep queries
 *    pg_constraint for FK column sets that no existing index covers as a
 *    prefix, and creates a b-tree named `<table>_<col>_fkauto_idx` for each.
 *    Deterministic for a given schema, idempotent across re-runs.
 *
 * B. Hot-path indexes mirroring 2026_05_10_000001 (which is MySQL-gated and
 *    no-ops here), upgraded with Postgres-only features:
 *      - partial indexes (soft-delete- and flag-filtered)
 *      - covering INCLUDE index for the top-customers aggregation
 *
 * C. json → jsonb column sweep.
 *    Laravel's `$table->json()` maps to the plain `json` type on Postgres —
 *    slower comparisons, no binary storage. Every
 *    `information_schema.columns.data_type = 'json'` column is upgraded with
 *    a lossless `USING <col>::jsonb` cast. (Most translatable columns were
 *    authored as jsonb already; this catches stragglers.)
 *
 * NOTE for existing production data: plain CREATE INDEX takes a write lock.
 * On a fresh database (our case) that is irrelevant; on a loaded cluster run
 * the statements manually with CREATE INDEX CONCURRENTLY instead.
 *
 * NO-OP on non-Postgres drivers.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $this->indexUncoveredForeignKeys();
        $this->createHotPathIndexes();
        $this->upgradeJsonColumnsToJsonb();
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // A. Drop every index the FK sweep created (recognisable suffix).
        $rows = DB::select(
            "SELECT indexname FROM pg_indexes
             WHERE schemaname = current_schema() AND indexname LIKE '%\_fkauto\_idx'",
        );
        foreach ($rows as $row) {
            DB::statement("DROP INDEX IF EXISTS {$row->indexname}");
        }

        // B. Targeted hot-path indexes.
        foreach ([
            'orders_tenant_customer_created_idx',
            'orders_tenant_payment_status_idx',
            'orders_top_customers_covering_idx',
            'payments_tenant_created_idx',
            'payments_tenant_status_created_idx',
            'notifications_log_channel_status_created_idx',
            'menu_items_low_stock_partial_idx',
            'menu_items_browse_partial_idx',
            'visit_tokens_tenant_created_idx',
        ] as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }

        // C. json→jsonb is not reverted: the cast is lossless and nothing on
        // the MySQL side reads these columns any more.
    }

    // ── A ────────────────────────────────────────────────────────────────
    private function indexUncoveredForeignKeys(): void
    {
        // Every FK constraint in the current schema whose (ordered) column
        // list is NOT the prefix of any existing index on the same table.
        $missing = DB::select(<<<'SQL'
            SELECT
                cl.relname                                   AS table_name,
                (SELECT string_agg(att.attname, ',' ORDER BY ord.n)
                   FROM unnest(con.conkey) WITH ORDINALITY AS ord(attnum, n)
                   JOIN pg_attribute att
                     ON att.attrelid = con.conrelid AND att.attnum = ord.attnum
                )                                            AS fk_columns
            FROM pg_constraint con
            JOIN pg_class cl        ON cl.oid = con.conrelid
            JOIN pg_namespace nsp   ON nsp.oid = cl.relnamespace
            WHERE con.contype = 'f'
              AND nsp.nspname = current_schema()
              AND NOT EXISTS (
                  SELECT 1
                  FROM pg_index idx
                  WHERE idx.indrelid = con.conrelid
                    -- a PARTIAL index does not cover every row, so it does
                    -- not count as covering the FK
                    AND idx.indpred IS NULL
                    AND (idx.indkey::int2[])[0:cardinality(con.conkey)-1]
                        = con.conkey::int2[]
              )
            ORDER BY 1, 2
        SQL);

        foreach ($missing as $fk) {
            $columns = explode(',', (string) $fk->fk_columns);
            $name = $fk->table_name.'_'.implode('_', $columns).'_fkauto_idx';
            // Postgres identifier limit is 63 bytes — hash-shorten if needed.
            if (strlen($name) > 63) {
                $name = substr($fk->table_name, 0, 20).'_'.substr(md5($name), 0, 10).'_fkauto_idx';
            }
            $cols = implode(', ', $columns);
            DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$fk->table_name} ({$cols})");
        }
    }

    // ── B ────────────────────────────────────────────────────────────────
    private function createHotPathIndexes(): void
    {
        if (Schema::hasTable('orders')) {
            // Customer history page:
            //   WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC
            DB::statement(
                'CREATE INDEX IF NOT EXISTS orders_tenant_customer_created_idx '
                .'ON orders (tenant_id, customer_id, created_at DESC)'
            );

            // Debtors / unpaid dashboards — partial keeps it tiny because the
            // overwhelming majority of historical orders are `paid`.
            DB::statement(
                'CREATE INDEX IF NOT EXISTS orders_tenant_payment_status_idx '
                .'ON orders (tenant_id, payment_status) '
                ."WHERE payment_status IN ('unpaid', 'partial', 'pending')"
            );

            // Top-customers aggregation:
            //   WHERE tenant_id = ? GROUP BY customer_id ORDER BY SUM(total_amount)
            // INCLUDE keeps total_amount in the leaf pages → index-only scan,
            // the Postgres upgrade of 2026_05_10_000002's covering index.
            DB::statement(
                'CREATE INDEX IF NOT EXISTS orders_top_customers_covering_idx '
                .'ON orders (tenant_id, customer_id) INCLUDE (total_amount)'
            );
        }

        if (Schema::hasTable('payments')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS payments_tenant_created_idx '
                .'ON payments (tenant_id, created_at DESC)'
            );
            DB::statement(
                'CREATE INDEX IF NOT EXISTS payments_tenant_status_created_idx '
                .'ON payments (tenant_id, status, created_at DESC)'
            );
        }

        if (Schema::hasTable('notifications_log')) {
            // Super-admin cross-tenant feed by channel/status.
            DB::statement(
                'CREATE INDEX IF NOT EXISTS notifications_log_channel_status_created_idx '
                .'ON notifications_log (channel, status, created_at DESC)'
            );
        }

        if (Schema::hasTable('menu_items')) {
            // Low-stock dashboard:
            //   WHERE tenant_id = ? AND stock_tracked AND current_stock <= threshold
            if (Schema::hasColumn('menu_items', 'stock_tracked')) {
                DB::statement(
                    'CREATE INDEX IF NOT EXISTS menu_items_low_stock_partial_idx '
                    .'ON menu_items (tenant_id, current_stock) '
                    .'WHERE stock_tracked'
                );
            }

            // Menu browse (QR / kiosk / POS):
            //   WHERE tenant_id = ? AND is_active AND deleted_at IS NULL
            //   ORDER BY sort_order
            DB::statement(
                'CREATE INDEX IF NOT EXISTS menu_items_browse_partial_idx '
                .'ON menu_items (tenant_id, sort_order) '
                .'WHERE is_active AND deleted_at IS NULL'
            );
        }

        if (Schema::hasTable('visit_tokens')) {
            // CEO token list is always "newest first per owned-tenant set".
            DB::statement(
                'CREATE INDEX IF NOT EXISTS visit_tokens_tenant_created_idx '
                .'ON visit_tokens (tenant_id, created_at DESC)'
            );
        }
    }

    // ── C ────────────────────────────────────────────────────────────────
    private function upgradeJsonColumnsToJsonb(): void
    {
        $columns = DB::select(
            "SELECT table_name, column_name
             FROM information_schema.columns
             WHERE table_schema = current_schema() AND data_type = 'json'
             ORDER BY table_name, column_name",
        );

        foreach ($columns as $col) {
            DB::statement(sprintf(
                'ALTER TABLE %s ALTER COLUMN %s TYPE jsonb USING %s::jsonb',
                $col->table_name,
                $col->column_name,
                $col->column_name,
            ));
        }
    }
};
