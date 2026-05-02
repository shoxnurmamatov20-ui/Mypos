<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 — Tenant Branding.
 *
 * One row per tenant — `tenant_id` is BOTH the primary key and the foreign key.
 * This is a 1:1 extension of `tenants` (separate table to keep the core
 * `tenants` row narrow & cache-friendly; brand rarely changes, may be lazy).
 *
 * All asset URLs point at MinIO (`*.cdn.mypos.uz`). Colors are stored as
 * 7-char hex (`#RRGGBB`) — alpha is intentionally omitted; CSS opacity utilities
 * provide variant tones at render time.
 *
 * i18n marketing copy (hero/tagline) lives in JSONB with the standard
 * `{uz, ru, en}` shape, mirroring the project's translation-key convention.
 *
 * `custom_css` is a Plus-tier feature — sanitized & length-capped at the
 * application layer (FormRequest) before insertion; no DB-level length cap so
 * an Enterprise tenant can paste a substantial stylesheet.
 *
 * RLS: tenant_id IS the PK so the policy is trivially correct on every row.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('tenant_brands')) {
            return;
        }

        Schema::create('tenant_brands', function (Blueprint $table): void {
            // tenant_id IS the PK — strict 1:1 with tenants.
            $table->uuid('tenant_id')->primary();

            // Theme selector — 'modern' | 'classic' | 'minimal' | 'premium'.
            $table->string('theme', 32)->default('modern');

            // ----- Logos & images (MinIO public URLs) -----------------------
            $table->string('logo_url', 512)->nullable();
            $table->string('logo_dark_url', 512)->nullable();
            $table->string('favicon_url', 512)->nullable();
            $table->string('cover_image_url', 512)->nullable();
            $table->string('hero_image_url', 512)->nullable();
            $table->string('ogimage_url', 512)->nullable();

            // ----- Colors (hex `#RRGGBB`) -----------------------------------
            $table->string('primary_color', 7)->default('#EA7C69');
            $table->string('accent_color', 7)->default('#9333EA');
            $table->string('text_color', 7)->default('#0F172A');
            $table->string('background_color', 7)->default('#FFFFFF');

            // ----- Typography -----------------------------------------------
            $table->string('font_family', 64)->default('Inter');
            $table->string('font_heading', 64)->nullable();

            // ----- Marketing copy (i18n: { uz, ru, en }) --------------------
            $table->jsonb('hero_title')->nullable();
            $table->jsonb('hero_subtitle')->nullable();
            $table->jsonb('tagline')->nullable();

            // ----- Custom CSS (Plus tier) -----------------------------------
            $table->text('custom_css')->nullable();

            // ----- Social ---------------------------------------------------
            $table->string('instagram_handle', 64)->nullable();
            $table->string('facebook_url', 255)->nullable();
            $table->string('telegram_handle', 64)->nullable();

            $table->timestamps();
        });

        Schema::table('tenant_brands', function (Blueprint $table): void {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });

        // Row-Level Security — tenant isolation, super-admin '*' bypass.
        // tenant_id is the PK so every row is unambiguously tenant-scoped.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tenant_brands ENABLE ROW LEVEL SECURITY');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_brands ON tenant_brands');
            DB::statement("
                CREATE POLICY tenant_isolation_tenant_brands ON tenant_brands
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
        if (! Schema::hasTable('tenant_brands')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_tenant_brands ON tenant_brands');
            DB::statement('ALTER TABLE tenant_brands DISABLE ROW LEVEL SECURITY');
        }

        Schema::dropIfExists('tenant_brands');
    }
};
