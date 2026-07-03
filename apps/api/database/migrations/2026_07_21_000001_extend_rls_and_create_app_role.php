<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ADR-0006 (2026-07-02): PostgreSQL is the primary database again. This
 * migration restores full Row-Level-Security coverage — defense-in-depth
 * layer 2 behind the `BelongsToTenant` Eloquent scope — and provisions the
 * runtime role the RLS test-suite and production deployments enforce with.
 *
 * 1. Role `mypos_app` (NOLOGIN shell, idempotent):
 *    - Local/CI: `SET ROLE mypos_app` in TenantIsolationRlsTest drops the
 *      superuser's implicit RLS bypass so policies are actually exercised.
 *    - Production: ops promotes it with `ALTER ROLE mypos_app LOGIN
 *      PASSWORD ...` (see infra/scripts/pg-app-role.sql) and points the web
 *      runtime's DB_USERNAME at it. Table owner (migrator) stays separate.
 *
 * 2. RLS on every tenant-scoped table created AFTER the original
 *    2026_05_01_000001 migration (they were added during the MySQL period,
 *    ADR-0005, when RLS did not exist):
 *      order_reviews, warehouses, incoming_documents, waste_documents,
 *      audit_sessions, transfer_documents, departments, units_of_measure.
 *
 *    visit_tokens gets the RELAXED policy (empty GUC allowed) because the
 *    public guest-feedback flow must look a token up by hash BEFORE any
 *    tenant context exists — same pattern as staff_pin_attempts.
 *
 * Deliberately NOT covered (documented, not forgotten):
 *   - *_document_items / audit_session_items — no tenant_id column; they are
 *     reachable only through their RLS-protected parent documents.
 *   - tenant_owners — ownership mapping read by EnsureCEO/ownedTenants()
 *     BEFORE any GUC exists (CEO users are cross-tenant); same class as
 *     `tenants` and `users`.
 *   - clinics/* , regions, districts, countries, currencies, exchange_rates —
 *     platform-level tables without tenant_id.
 */
return new class extends Migration
{
    /** Strict tenant-match policies. @var list<string> */
    private array $strict = [
        'order_reviews',
        'warehouses',
        'incoming_documents',
        'waste_documents',
        'audit_sessions',
        'transfer_documents',
        'departments',
        'units_of_measure',
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $this->createAppRole();

        foreach ($this->strict as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $policy = "tenant_isolation_{$table}";

            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");
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

        // visit_tokens: empty GUC allowed — the public /f/{token} lookup runs
        // pre-auth, and the CEO panel (cross-tenant, no GUC) manages batches.
        // A session pinned to tenant A still cannot read tenant B's tokens.
        if (Schema::hasTable('visit_tokens')) {
            DB::statement('ALTER TABLE visit_tokens ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_visit_tokens ON visit_tokens');
            DB::statement("
                CREATE POLICY tenant_isolation_visit_tokens ON visit_tokens
                USING (
                    COALESCE(current_setting('app.current_tenant_id', true), '') = ''
                    OR tenant_id::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = '*'
                )
                WITH CHECK (
                    COALESCE(current_setting('app.current_tenant_id', true), '') = ''
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

        foreach ([...$this->strict, 'visit_tokens'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_{$table} ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }

        // The mypos_app role and its grants are left in place on purpose:
        // other databases in the cluster may share the role, and re-running
        // `up()` is idempotent either way.
    }

    private function createAppRole(): void
    {
        // Cluster-level object — guarded so concurrent test databases and
        // re-runs never collide.
        DB::unprepared(<<<'SQL'
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mypos_app') THEN
                    CREATE ROLE mypos_app NOLOGIN;
                END IF;
            END
            $$;
        SQL);

        DB::unprepared(<<<'SQL'
            GRANT USAGE ON SCHEMA public TO mypos_app;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mypos_app;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mypos_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
                GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mypos_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
                GRANT USAGE, SELECT ON SEQUENCES TO mypos_app;
        SQL);
    }
};
