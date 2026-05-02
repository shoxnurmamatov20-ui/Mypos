<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — Make currency explicit on orders + payments.
 *
 * Both tables already have a `currency` column (`varchar(8)` default 'UZS')
 * but it's NOT FK-constrained — it's just a free-text label. We add a NEW
 * `currency_code` CHAR(3) FK to currencies(code) so:
 *
 *   1. Constrained values: no more 'usd' vs 'USD' vs 'so'm' inconsistency.
 *   2. Foreign-key joins for FX conversion in reports.
 *   3. Future-proof for multi-currency tenants (Enterprise tier may run
 *      restaurants accepting USD alongside local currency).
 *
 * Default 'UZS' is correct: every existing row is from an uzbek tenant
 * before Phase 4 launched, so the backfill is semantically accurate.
 *
 * We deliberately KEEP the legacy `currency` varchar column for now —
 * deprecating it is a separate Phase 5 cleanup task once all reads are
 * migrated to `currency_code`. Doing the rename in one migration would
 * require a code-freeze window we don't have.
 *
 * Idempotent — guarded by hasColumn checks.
 */
return new class extends Migration {
    /**
     * @var array<int, string>
     */
    private array $tables = ['orders', 'payments'];

    public function up(): void
    {
        if (! Schema::hasTable('currencies')) {
            throw new \RuntimeException(
                'add_currency_to_orders_payments requires currencies table. '
                . 'Run 2026_07_01_000002_create_currencies_table.php first.'
            );
        }

        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            // 1) Add column (default 'UZS' — correct for every existing row).
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (! Schema::hasColumn($tableName, 'currency_code')) {
                    // Place it next to the existing `currency` field for
                    // visual coherence in pgAdmin / DBeaver.
                    $table->char('currency_code', 3)
                        ->default('UZS')
                        ->after('currency');
                }
            });

            // 2) Optional backfill: copy `currency` → `currency_code` only
            //    where the source value is a valid 3-char uppercase ISO
            //    code. Anything else stays at the default 'UZS'. This is a
            //    DATA migration but it's an idempotent transform on a single
            //    column — running it again is a no-op (the second pass
            //    finds the same valid codes and overwrites them with the
            //    same values).
            //
            // Skip on non-postgres drivers (sqlite tests) where `currency`
            // may not exist yet.
            if (
                DB::connection()->getDriverName() === 'pgsql'
                && Schema::hasColumn($tableName, 'currency')
            ) {
                DB::statement("
                    UPDATE {$tableName}
                    SET currency_code = UPPER(currency)
                    WHERE currency IS NOT NULL
                      AND LENGTH(currency) = 3
                      AND UPPER(currency) IN (SELECT code FROM currencies)
                ");
            }

            // 3) FK constraint to currencies(code).
            Schema::table($tableName, function (Blueprint $table): void {
                try {
                    $table->foreign('currency_code')
                        ->references('code')
                        ->on('currencies')
                        ->restrictOnDelete();
                } catch (\Throwable $e) {
                    // FK already exists.
                }
            });

            // 4) Composite index for tenant-scoped multi-currency reports
            //    ("show me KZT revenue for tenant X over Y dates"). The
            //    existing tenant_id+created_at indexes don't cover the
            //    currency dimension.
            if (DB::connection()->getDriverName() === 'pgsql') {
                $idxName = "{$tableName}_tenant_currency_idx";
                DB::statement("
                    CREATE INDEX IF NOT EXISTS {$idxName}
                    ON {$tableName} (tenant_id, currency_code)
                ");
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            if (DB::connection()->getDriverName() === 'pgsql') {
                $idxName = "{$tableName}_tenant_currency_idx";
                DB::statement("DROP INDEX IF EXISTS {$idxName}");
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (Schema::hasColumn($tableName, 'currency_code')) {
                    try {
                        $table->dropForeign(['currency_code']);
                    } catch (\Throwable $e) {
                        // FK didn't exist.
                    }
                    $table->dropColumn('currency_code');
                }
            });
        }
    }
};
