<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Enable PostgreSQL Row-Level Security (RLS) on every tenant-scoped table that
 * doesn't already have it. This is defense-in-depth — even if the application
 * layer Eloquent global scope is bypassed (raw query, mistake in Repository,
 * compromised model), the database refuses to return rows from foreign tenants.
 *
 * Mechanism:
 *   - Each request, middleware {@see App\Http\Middleware\SetTenantContext} runs
 *     `SET LOCAL app.current_tenant_id = '<uuid>'` on the connection.
 *   - The policy `USING (tenant_id::text = current_setting(...))` filters rows
 *     to that tenant.
 *   - Super-admin context sets the GUC to the literal string '*' to bypass.
 *
 * Tables already RLS-protected (skipped):
 *   - courier_locations, kiosk_devices, kiosk_pairing_codes, shift_breaks
 *
 * Tables intentionally NOT covered by RLS:
 *   - tenants                 — owned by super admin, queried before GUC set
 *   - users                   — nullable tenant_id; login flow runs pre-GUC
 *   - audit_logs              — append-only, super admin needs cross-tenant view
 *   - super_admin_invitations — global (no tenant_id)
 *   - notification_preferences — user-scoped (no tenant_id)
 *   - tenant_registration_pins — pre-tenant lifecycle
 */
return new class extends Migration {
    /**
     * Tables to protect: name => policy_suffix.
     *
     * Policy suffix keeps each policy name unique in pg_policy
     * (PostgreSQL allows the same policy name across tables, but unique names
     *  make troubleshooting easier with `\d+ <table>`).
     *
     * @var array<string, string>
     */
    private array $tables = [
        'menu_categories'      => 'menu_categories',
        'menu_items'           => 'menu_items',
        'table_categories'     => 'table_categories',
        'tables'               => 'tables',
        'orders'               => 'orders',
        'order_items'          => 'order_items',
        'customers'            => 'customers',
        'loyalty_programs'     => 'loyalty_programs',
        'loyalty_accounts'     => 'loyalty_accounts',
        'loyalty_transactions' => 'loyalty_transactions',
        'employees'            => 'employees',
        'shifts'               => 'shifts',
        'time_clock_events'    => 'time_clock_events',
        'ingredient_categories' => 'ingredient_categories',
        'ingredients'          => 'ingredients',
        'recipes'              => 'recipes',
        'stock_movements'      => 'stock_movements',
        'suppliers'            => 'suppliers',
        'payments'             => 'payments',
        'notifications_log'    => 'notifications_log',
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            // RLS is a PostgreSQL feature — silently skip on sqlite/mysql tests.
            return;
        }

        foreach ($this->tables as $table => $suffix) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $policy = "tenant_isolation_{$suffix}";

            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");
            // Idempotent — drop first so re-running migration is safe.
            DB::statement("DROP POLICY IF EXISTS {$policy} ON {$table}");
            DB::statement("
                CREATE POLICY {$policy} ON {$table}
                USING (
                    tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
                WITH CHECK (
                    tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
            ");
        }

        // staff_pin_attempts: tenant_id is NULLABLE because phone alone may not
        // resolve a tenant at PIN-attempt time. Allow rows where tenant_id IS NULL
        // to be readable so the rate-limiter can count cross-tenant attempts by
        // phone, and writable when no GUC is set yet.
        if (Schema::hasTable('staff_pin_attempts')) {
            DB::statement('ALTER TABLE staff_pin_attempts ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_staff_pin_attempts ON staff_pin_attempts');
            DB::statement("
                CREATE POLICY tenant_isolation_staff_pin_attempts ON staff_pin_attempts
                USING (
                    tenant_id IS NULL
                    OR tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
                WITH CHECK (
                    tenant_id IS NULL
                    OR tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
            ");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->tables as $table => $suffix) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $policy = "tenant_isolation_{$suffix}";

            DB::statement("DROP POLICY IF EXISTS {$policy} ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }

        if (Schema::hasTable('staff_pin_attempts')) {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_staff_pin_attempts ON staff_pin_attempts');
            DB::statement('ALTER TABLE staff_pin_attempts DISABLE ROW LEVEL SECURITY');
        }
    }
};
