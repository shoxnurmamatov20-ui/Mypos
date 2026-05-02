<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 — Tier-based feature gating.
 *
 * Adds `tier` + lifecycle timestamps to the `tenants` table so the application
 * can gate features per plan:
 *
 *   - free       → MyPOS subdomain only (e.g. `jome.mypos.uz`)
 *   - pro        → custom subdomain + branding presets
 *   - plus       → custom domain (CNAME), full branding, custom_css
 *   - enterprise → native white-label app, multi-domain, priority support
 *
 * Note on naming: `subscription_plan` already exists from
 * `2026_04_25_440001_add_subscription_to_tenants.php` and tracks Stripe-style
 * billing plan IDs. `tier` is the *capability* axis — they may diverge during
 * grandfathering or promo-grants. Both are intentionally kept.
 *
 * Defensive: every column is guarded with `Schema::hasColumn` so the migration
 * is safely re-runnable in environments where some columns were back-ported.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'tier')) {
                // 'free' | 'pro' | 'plus' | 'enterprise'
                $table->string('tier', 32)->default('free');
            }
            if (! Schema::hasColumn('tenants', 'tier_started_at')) {
                $table->timestamp('tier_started_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'tier_expires_at')) {
                $table->timestamp('tier_expires_at')->nullable();
            }
        });

        if (Schema::hasColumn('tenants', 'tier')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->index('tier', 'tenants_tier_idx');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        Schema::table('tenants', function (Blueprint $table): void {
            try {
                $table->dropIndex('tenants_tier_idx');
            } catch (\Throwable $e) {
                // index may already be gone — ignore
            }

            $columns = array_filter([
                Schema::hasColumn('tenants', 'tier_expires_at') ? 'tier_expires_at' : null,
                Schema::hasColumn('tenants', 'tier_started_at') ? 'tier_started_at' : null,
                Schema::hasColumn('tenants', 'tier') ? 'tier' : null,
            ]);

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
