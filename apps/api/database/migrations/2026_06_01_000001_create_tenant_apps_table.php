<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — Native App Builder.
 *
 * One row per (tenant, platform). A tenant may have:
 *   - separate iOS + Android rows (most common — divergent App Store / Play
 *     Store metadata, distinct bundle/package IDs), OR
 *   - a single 'universal' row when both platforms share the exact same
 *     identity & assets (rare; mostly internal-test scenarios).
 *
 * Lifecycle (managed by Agent D2/D3 actions):
 *   draft → configuring → building → review → live
 *                                          ↘ rejected ↗ (resubmit)
 *                                            paused
 *
 * Two ownership models for the developer account:
 *   - 'mypos'  — MyPOS Inc. owns the Apple/Google account, ships the apps
 *                under MyPOS's umbrella (Olo / Toast model). Default for all
 *                tiers up to Plus.
 *   - 'tenant' — Enterprise tenant brings their own Apple Developer Program
 *                + Google Play Console accounts. We just orchestrate the build.
 *
 * `latest_build_id` is denormalized on purpose — list views ("show me each
 * tenant's most recent build status") would otherwise need a window-function
 * join to `tenant_app_builds`. The Action layer keeps it consistent on dispatch.
 *
 * Constraints:
 *   - `bundle_id` is GLOBALLY unique among non-deleted rows (Apple & Google
 *     enforce per-developer-account uniqueness, but we want failure-fast at
 *     our layer if two tenants accidentally claim the same identifier).
 *   - At most one row per (tenant_id, platform) among non-deleted rows.
 *
 * RLS: standard tenant isolation with super-admin '*' bypass.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('tenant_apps')) {
            return;
        }

        Schema::create('tenant_apps', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            // ----- Platform -------------------------------------------------
            // 'ios' | 'android' | 'universal'
            $table->string('platform', 16);

            // ----- App identity --------------------------------------------
            // What shows in App Store / Play Store listing.
            $table->string('app_name', 64);
            // Short label shown beneath the home-screen icon (iOS truncates
            // long names; Android shows full name unless a launcher overrides).
            $table->string('short_name', 32)->nullable();
            // Reverse-DNS bundle / package identifier. Apple max ~155 chars,
            // Google max 255 — pick the larger of the two.
            $table->string('bundle_id', 255);

            // i18n marketing copy: { uz, ru, en } shape — same convention as
            // tenant_brands.hero_title etc.
            $table->jsonb('description')->default(DB::raw("'{}'::jsonb"));
            // ASCII keywords array for ASO. JSONB so we can also store
            // per-locale variants if Apple's `keywords` field gets populated
            // per language at submission time.
            $table->jsonb('keywords')->default(DB::raw("'{}'::jsonb"));

            // ----- Visual assets (MinIO public URLs) ------------------------
            // 1024x1024 PNG, no alpha — App Store icon master.
            $table->string('icon_url', 512)->nullable();
            // Per-platform splash / launch screen.
            $table->string('splash_url', 512)->nullable();
            // Android adaptive icon foreground (108dp safe zone within 432dp).
            $table->string('adaptive_icon_url', 512)->nullable();
            // Android adaptive icon background — solid hex `#RRGGBB`.
            $table->string('adaptive_icon_bg', 7)->nullable();
            // Play Store feature graphic 1024x500.
            $table->string('feature_graphic_url', 512)->nullable();
            // Array of screenshot URLs grouped by device class:
            //   [{ "device": "iphone_6_7", "urls": [...] }, ...]
            $table->jsonb('screenshots')->default(DB::raw("'[]'::jsonb"));

            // ----- Apple-specific ------------------------------------------
            // 10-char Apple Team ID.
            $table->string('apple_team_id', 16)->nullable();
            // App Store Connect numeric app ID — issued after first submission.
            $table->bigInteger('apple_app_id')->nullable();
            // SKU is owner-defined; uniqueness only required within the
            // developer account, so we don't enforce it here.
            $table->string('apple_sku', 64)->nullable();

            // ----- Google-specific -----------------------------------------
            // Usually identical to bundle_id but kept separate so cross-platform
            // 'universal' rows can specify divergent identifiers if needed.
            $table->string('google_package_name', 255)->nullable();
            // Play Console app ID (long numeric string).
            $table->string('google_app_id', 64)->nullable();

            // ----- Build account choice ------------------------------------
            // 'mypos' (default — shipped under MyPOS Inc.) or 'tenant'
            // (Enterprise: tenant uses their own Apple/Google accounts).
            $table->string('build_account', 16)->default('mypos');

            // ----- Status --------------------------------------------------
            // 'draft' | 'configuring' | 'building' | 'review' | 'live'
            //   | 'rejected' | 'paused'
            $table->string('status', 32)->default('draft');

            // SemVer marketing version & monotonically increasing build #.
            $table->string('current_version', 32)->nullable();
            $table->integer('current_build_number')->nullable();

            // Denormalized pointer to the most recent tenant_app_builds row.
            // Soft FK (no constraint) to avoid a circular dependency with
            // tenant_app_builds.tenant_app_id.
            $table->uuid('latest_build_id')->nullable();

            // Submission tracking — populated by App Store / Play Console
            // webhooks via Agent D2's listener.
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id', 'tenant_apps_tenant_idx');
            $table->index('status', 'tenant_apps_status_idx');
        });

        Schema::table('tenant_apps', function (Blueprint $table): void {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        // Partial unique indexes: PostgreSQL-only, raw SQL.
        // (Laravel's Schema builder cannot express WHERE clauses on indexes.)
        if (DB::connection()->getDriverName() === 'pgsql') {
            // Globally unique bundle_id across non-deleted rows. Lets a tenant
            // re-claim a bundle they previously soft-deleted.
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS tenant_apps_bundle_uq
                ON tenant_apps (bundle_id)
                WHERE deleted_at IS NULL
            ');

            // At most one live row per (tenant, platform).
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS tenant_apps_tenant_platform_uq
                ON tenant_apps (tenant_id, platform)
                WHERE deleted_at IS NULL
            ');

            // Row-Level Security — tenant isolation, super-admin '*' bypass.
            DB::statement('ALTER TABLE tenant_apps ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_apps ON tenant_apps');
            DB::statement("
                CREATE POLICY tenant_isolation_tenant_apps ON tenant_apps
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
        if (! Schema::hasTable('tenant_apps')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_apps ON tenant_apps');
            DB::statement('ALTER TABLE tenant_apps DISABLE ROW LEVEL SECURITY');
            DB::statement('DROP INDEX IF EXISTS tenant_apps_tenant_platform_uq');
            DB::statement('DROP INDEX IF EXISTS tenant_apps_bundle_uq');
        }

        Schema::dropIfExists('tenant_apps');
    }
};
