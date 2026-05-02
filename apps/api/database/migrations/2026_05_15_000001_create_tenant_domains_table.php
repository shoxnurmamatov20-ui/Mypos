<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 — Custom Domain System.
 *
 * Each tenant may attach one or more custom domains (e.g. `jomeburger.uz`,
 * `shop.lavashhouse.com`). Domains go through a verification + SSL provisioning
 * lifecycle before they can route traffic.
 *
 * Lifecycle (managed by Agent C2/C3 actions):
 *   1. Owner submits domain → row created (is_verified=false, ssl=pending,
 *      verification_token=random64).
 *   2. Owner sets DNS TXT/CNAME → background job verifies → is_verified=true.
 *   3. Caddy ACME issues certificate → ssl_status='active', ssl_issued_at=NOW.
 *   4. Reverse-proxy maps Host header → tenant_id (cached lookup).
 *
 * Constraints worth noting:
 *   - `domain` is globally unique — two tenants cannot claim the same hostname.
 *   - At most one row per tenant may have `is_primary=true` (partial unique).
 *   - Soft-deleted rows are excluded from the primary uniqueness check so an
 *     owner can re-add a previously-removed domain.
 *   - `redirects_to` is plain string (not FK) because the canonical hostname
 *     might itself be a not-yet-created row at insertion time (chicken/egg).
 *
 * RLS: standard tenant isolation with super-admin '*' bypass — same template
 * as `2026_05_01_000001_enable_rls_on_tenant_scoped_tables.php`.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('tenant_domains')) {
            return;
        }

        Schema::create('tenant_domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            // RFC 1035 — fully-qualified domain name max length is 253 octets.
            $table->string('domain', 253);

            $table->boolean('is_primary')->default(false);
            $table->boolean('is_verified')->default(false);

            // 'txt' | 'cname'
            $table->string('verification_method', 16)->default('txt');
            $table->string('verification_token', 64);
            $table->timestamp('verified_at')->nullable();

            // 'pending' | 'provisioning' | 'active' | 'error'
            $table->string('ssl_status', 16)->default('pending');
            $table->timestamp('ssl_issued_at')->nullable();
            $table->text('ssl_error')->nullable();

            $table->timestamp('last_checked_at')->nullable();

            // Optional canonical redirect target (e.g. www.x.uz -> x.uz).
            $table->string('redirects_to', 253)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique('domain', 'tenant_domains_domain_uq');
            $table->index('tenant_id', 'tenant_domains_tenant_idx');
            $table->index('ssl_status', 'tenant_domains_ssl_status_idx');
        });

        Schema::table('tenant_domains', function (Blueprint $table): void {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        // Partial indexes: PostgreSQL-only, raw SQL.
        // (Laravel's Schema builder cannot express WHERE clauses on indexes.)
        if (DB::connection()->getDriverName() === 'pgsql') {
            // Only index verified rows — the live-routing lookup hits this.
            DB::statement('
                CREATE INDEX IF NOT EXISTS tenant_domains_verified_idx
                ON tenant_domains (is_verified)
                WHERE is_verified = true
            ');

            // Enforce: at most one primary, live (not soft-deleted) domain per tenant.
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS tenant_domains_primary_uq
                ON tenant_domains (tenant_id)
                WHERE is_primary = true AND deleted_at IS NULL
            ');

            // Row-Level Security — tenant isolation, super-admin '*' bypass.
            DB::statement('ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_domains ON tenant_domains');
            DB::statement("
                CREATE POLICY tenant_isolation_tenant_domains ON tenant_domains
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
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenant_domains')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_domains ON tenant_domains');
            DB::statement('ALTER TABLE tenant_domains DISABLE ROW LEVEL SECURITY');
            DB::statement('DROP INDEX IF EXISTS tenant_domains_primary_uq');
            DB::statement('DROP INDEX IF EXISTS tenant_domains_verified_idx');
        }

        Schema::dropIfExists('tenant_domains');
    }
};
