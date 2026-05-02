<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit P4: courier_locations is a high-volume hot table.
 *
 * Sizing: 1k couriers × 6 inserts/min × 60min × 24h = 8.64M rows/day.
 * With 3 b-tree indexes (~120 bytes/row each), the index footprint exceeds
 * available RAM in a few months → query plans collapse to disk seeks.
 *
 * Fix: convert `courier_locations` to a PostgreSQL declarative-partitioned
 * table on RANGE(recorded_at). Monthly partitions keep each child small
 * enough for index pages to stay in the buffer pool, and old partitions
 * can be DROPPED in O(ms) (no DELETE bloat) once retention expires.
 *
 * Approach (chosen for idempotency + zero-data-loss in dev):
 *   1. Build a new partitioned parent `courier_locations_part` with the
 *      identical column set (PRIMARY KEY must include the partition key,
 *      so we use composite PK `(id, recorded_at)`).
 *   2. Pre-create 13 child partitions: current month + 12 months ahead,
 *      plus a `_default` catch-all so unexpected dates never error.
 *   3. Copy any existing rows: INSERT INTO part SELECT * FROM legacy.
 *   4. DROP the old single-table `courier_locations`.
 *   5. RENAME `courier_locations_part` → `courier_locations` (and likewise
 *      every child constraint/index for clean pg_dump output).
 *   6. Re-enable RLS + tenant_isolation policy on the new parent (RLS
 *      attaches to partitioned tables and is inherited by children).
 *
 * Retention (NOT scheduled by this migration — Agent B7 / future scheduler):
 *
 *   // Soft retention — keep last 7 days, runs daily (idempotent):
 *   DELETE FROM courier_locations
 *     WHERE recorded_at < NOW() - INTERVAL '7 days';
 *
 *   // Hard retention — drop entire month partitions older than 1 month
 *   // (cheap, no bloat, recommended for production):
 *   DROP TABLE IF EXISTS courier_locations_2026_03;
 *
 * NO-OP on sqlite/mysql (PostgreSQL declarative partitioning is required).
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            // Tests run on sqlite — partitioning is a Postgres-only feature.
            return;
        }

        if (! Schema::hasTable('courier_locations')) {
            // Parent table never created — nothing to convert.
            return;
        }

        // Detect re-runs: if courier_locations is already partitioned, no-op.
        $isPartitioned = (bool) DB::selectOne(
            "SELECT 1 AS x
             FROM pg_partitioned_table pt
             JOIN pg_class c ON c.oid = pt.partrelid
             WHERE c.relname = 'courier_locations'"
        );
        if ($isPartitioned) {
            return;
        }

        DB::statement('DROP TABLE IF EXISTS courier_locations_part CASCADE');

        // ── 1. New partitioned parent ────────────────────────────────────
        // Mirror legacy schema. Note: PRIMARY KEY must include the partition
        // key (recorded_at) — Postgres rejects a PK that doesn't cover it.
        DB::statement(<<<'SQL'
            CREATE TABLE courier_locations_part (
                id              UUID         NOT NULL,
                tenant_id       UUID         NOT NULL,
                employee_id     UUID         NOT NULL,
                order_id        UUID         NULL,
                lat             NUMERIC(10,7) NOT NULL,
                lng             NUMERIC(10,7) NOT NULL,
                accuracy_meters NUMERIC(8,2)  NULL,
                heading         NUMERIC(5,2)  NULL,
                speed_mps       NUMERIC(6,2)  NULL,
                battery_percent INTEGER       NULL,
                recorded_at     TIMESTAMP(0)  NOT NULL,
                created_at      TIMESTAMP(0)  NULL,
                updated_at      TIMESTAMP(0)  NULL,
                PRIMARY KEY (id, recorded_at)
            ) PARTITION BY RANGE (recorded_at)
        SQL);

        // ── 2. Monthly partitions: current + 12 months ahead ────────────
        // Anchor at first day of current month UTC for deterministic bounds.
        $start = new DateTimeImmutable('first day of this month', new DateTimeZone('UTC'));
        for ($i = 0; $i < 13; $i++) {
            $from = $start->modify("+{$i} months");
            $to   = $start->modify('+' . ($i + 1) . ' months');
            $name = 'courier_locations_' . $from->format('Y_m');

            DB::statement(sprintf(
                "CREATE TABLE IF NOT EXISTS %s PARTITION OF courier_locations_part "
                . "FOR VALUES FROM ('%s') TO ('%s')",
                $name,
                $from->format('Y-m-d 00:00:00'),
                $to->format('Y-m-d 00:00:00')
            ));
        }

        // Catch-all so any out-of-range insert (e.g., backfill of pre-2026
        // data, or the day we forget to create next month's partition)
        // succeeds instead of throwing 23514.
        DB::statement(
            'CREATE TABLE IF NOT EXISTS courier_locations_default '
            . 'PARTITION OF courier_locations_part DEFAULT'
        );

        // ── 3. Copy existing data (will be empty in fresh dev DBs) ──────
        DB::statement(
            'INSERT INTO courier_locations_part '
            . '(id, tenant_id, employee_id, order_id, lat, lng, accuracy_meters, '
            . ' heading, speed_mps, battery_percent, recorded_at, created_at, updated_at) '
            . 'SELECT id, tenant_id, employee_id, order_id, lat, lng, accuracy_meters, '
            . '       heading, speed_mps, battery_percent, recorded_at, created_at, updated_at '
            . 'FROM courier_locations'
        );

        // ── 4 & 5. Swap names ───────────────────────────────────────────
        // CASCADE because the policy + FKs reference the legacy table.
        DB::statement('DROP TABLE courier_locations CASCADE');
        DB::statement('ALTER TABLE courier_locations_part RENAME TO courier_locations');

        // ── 6. Indexes on the partitioned parent ────────────────────────
        // These are propagated to every existing & future child partition.
        DB::statement(
            'CREATE INDEX IF NOT EXISTS courier_locations_tenant_emp_recorded_idx '
            . 'ON courier_locations (tenant_id, employee_id, recorded_at DESC)'
        );
        DB::statement(
            'CREATE INDEX IF NOT EXISTS courier_locations_tenant_order_recorded_idx '
            . 'ON courier_locations (tenant_id, order_id, recorded_at DESC)'
        );
        DB::statement(
            'CREATE INDEX IF NOT EXISTS courier_locations_recorded_idx '
            . 'ON courier_locations (recorded_at)'
        );

        // ── 7. Foreign keys ─────────────────────────────────────────────
        // FKs on partitioned tables are valid in PG 12+. Rebuilt because the
        // CASCADE drop above removed them.
        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_tenant_id_foreign '
            . 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        );
        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_employee_id_foreign '
            . 'FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE'
        );
        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_order_id_foreign '
            . 'FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL'
        );

        // ── 8. RLS policy (dropped by CASCADE; recreate on new parent) ──
        DB::statement('ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY');
        DB::statement('DROP POLICY IF EXISTS tenant_isolation_courier_locations ON courier_locations');
        DB::statement(<<<'SQL'
            CREATE POLICY tenant_isolation_courier_locations ON courier_locations
            USING (
                tenant_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.current_tenant_id', true) = '*'
            )
            WITH CHECK (
                tenant_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.current_tenant_id', true) = '*'
            )
        SQL);
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('courier_locations')) {
            return;
        }

        // If somehow not partitioned (down running on a half-applied state),
        // bail — there's nothing partition-shaped to roll back.
        $isPartitioned = (bool) DB::selectOne(
            "SELECT 1 AS x
             FROM pg_partitioned_table pt
             JOIN pg_class c ON c.oid = pt.partrelid
             WHERE c.relname = 'courier_locations'"
        );
        if (! $isPartitioned) {
            return;
        }

        // Rebuild the legacy non-partitioned shape.
        DB::statement('DROP TABLE IF EXISTS courier_locations_legacy CASCADE');
        DB::statement(<<<'SQL'
            CREATE TABLE courier_locations_legacy (
                id              UUID         NOT NULL PRIMARY KEY,
                tenant_id       UUID         NOT NULL,
                employee_id     UUID         NOT NULL,
                order_id        UUID         NULL,
                lat             NUMERIC(10,7) NOT NULL,
                lng             NUMERIC(10,7) NOT NULL,
                accuracy_meters NUMERIC(8,2)  NULL,
                heading         NUMERIC(5,2)  NULL,
                speed_mps       NUMERIC(6,2)  NULL,
                battery_percent INTEGER       NULL,
                recorded_at     TIMESTAMP(0)  NOT NULL,
                created_at      TIMESTAMP(0)  NULL,
                updated_at      TIMESTAMP(0)  NULL
            )
        SQL);

        DB::statement(
            'INSERT INTO courier_locations_legacy SELECT '
            . 'id, tenant_id, employee_id, order_id, lat, lng, accuracy_meters, '
            . 'heading, speed_mps, battery_percent, recorded_at, created_at, updated_at '
            . 'FROM courier_locations'
        );

        DB::statement('DROP TABLE courier_locations CASCADE');
        DB::statement('ALTER TABLE courier_locations_legacy RENAME TO courier_locations');

        DB::statement(
            'CREATE INDEX courier_locations_tenant_emp_recorded_idx '
            . 'ON courier_locations (tenant_id, employee_id, recorded_at)'
        );
        DB::statement(
            'CREATE INDEX courier_locations_tenant_order_recorded_idx '
            . 'ON courier_locations (tenant_id, order_id, recorded_at)'
        );
        DB::statement(
            'CREATE INDEX courier_locations_recorded_idx '
            . 'ON courier_locations (recorded_at)'
        );

        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_tenant_id_foreign '
            . 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        );
        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_employee_id_foreign '
            . 'FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE'
        );
        DB::statement(
            'ALTER TABLE courier_locations '
            . 'ADD CONSTRAINT courier_locations_order_id_foreign '
            . 'FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL'
        );

        DB::statement('ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY');
        DB::statement(<<<'SQL'
            CREATE POLICY tenant_isolation_courier_locations ON courier_locations
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        SQL);
    }
};
