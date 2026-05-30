<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — Native App Builder.
 *
 * Adds preview-only fields to `tenant_brands` (Phase 2). These power the
 * brand-studio's "what your native app will look like" preview that owners
 * see *before* they commit to triggering an EAS Build into `tenant_apps`.
 *
 * Why duplicate icon/splash here when tenant_apps has its own?
 *   - tenant_brands is the live, always-editable source of truth for the
 *     web/QR experience. Native-app preview should reflect the tenant's
 *     current brand the moment they edit it — not require a fake
 *     tenant_apps row.
 *   - On dispatch, Agent D2's Action will COPY these fields into a fresh
 *     `tenant_apps` row (or an existing one) and lock them at that version.
 *
 * Defensive: every column is guarded with `Schema::hasColumn` so the
 * migration is safely re-runnable.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('tenant_brands')) {
            return;
        }

        Schema::table('tenant_brands', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenant_brands', 'native_app_icon_url')) {
                // 1024x1024 master icon for native app preview.
                $table->string('native_app_icon_url', 512)->nullable();
            }

            if (! Schema::hasColumn('tenant_brands', 'native_app_splash_url')) {
                // Splash / launch screen preview asset.
                $table->string('native_app_splash_url', 512)->nullable();
            }

            if (! Schema::hasColumn('tenant_brands', 'native_app_screenshots')) {
                // Mock-up screenshots arranged for store-listing preview.
                // Same shape as tenant_apps.screenshots:
                //   [{ "device": "iphone_6_7", "urls": [...] }, ...]
                // Driver-portable JSON empty-default — see ADR-0005.
                $emptyArrayDefault = DB::connection()->getDriverName() === 'pgsql'
                    ? DB::raw("'[]'::jsonb")
                    : DB::raw("('[]')");
                $table->jsonb('native_app_screenshots')
                    ->default($emptyArrayDefault);
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenant_brands')) {
            return;
        }

        Schema::table('tenant_brands', function (Blueprint $table): void {
            $columns = array_filter([
                Schema::hasColumn('tenant_brands', 'native_app_screenshots') ? 'native_app_screenshots' : null,
                Schema::hasColumn('tenant_brands', 'native_app_splash_url') ? 'native_app_splash_url' : null,
                Schema::hasColumn('tenant_brands', 'native_app_icon_url') ? 'native_app_icon_url' : null,
            ]);

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
