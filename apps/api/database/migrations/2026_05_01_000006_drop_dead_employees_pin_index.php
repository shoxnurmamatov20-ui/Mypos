<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit M5: drop the unused `employees_tenant_pin_idx` compound index on
 * (tenant_id, pin_code_hash).
 *
 * Why: pin_code_hash is a bcrypt digest (random per save). PIN lookup is
 * always done by hashing the user-supplied PIN against every active row's
 * stored hash — never by an equality predicate on the hash column itself.
 * The index therefore costs write throughput for zero query benefit. We
 * still keep `(tenant_id, status)` for the active-employee lookup that
 * actually feeds the PIN attempt loop.
 *
 * The down() side recreates the index for safe rollback (matches the
 * original 2026_04_25_410001_add_pin_code_to_employees migration).
 *
 * NO-OP on sqlite/mysql: the original index is PG-specific.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }
        if (! Schema::hasTable('employees')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS employees_tenant_pin_idx');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }
        if (! Schema::hasTable('employees') || ! Schema::hasColumn('employees', 'pin_code_hash')) {
            return;
        }

        DB::statement(
            'CREATE INDEX IF NOT EXISTS employees_tenant_pin_idx '
            . 'ON employees (tenant_id, pin_code_hash)'
        );
    }
};
