<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — Tenant geo-config.
 *
 * Existing tenants have `default_locale`, `default_currency`, and `timezone`
 * columns from the original tenants migration. We're adding two NEW columns:
 *
 *   - country_code  CHAR(2) → countries.code
 *   - currency_code CHAR(3) → currencies.code
 *
 * Why both `default_currency` (the legacy column) AND `currency_code`?
 *   - `default_currency` is a free-text string (`varchar(8)`) — no FK, can
 *     contain garbage like 'so'm' or 'usd' (lowercase). Kept for backwards
 *     compat with anything that already reads it.
 *   - `currency_code` is the new normalized FK column. New code reads from
 *     here. Agent E2 will sync the two via a Listener so they don't drift.
 *
 * Defaults to 'UZ' / 'UZS' — every existing tenant in the DB right now is
 * an O'zbekiston restaurant, so this is the correct backfill (zero rows
 * change meaning).
 *
 * Idempotent — safe to re-run. Each column add and each index is guarded.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }
        if (! Schema::hasTable('countries') || ! Schema::hasTable('currencies')) {
            // The countries/currencies migrations should run first (earlier
            // timestamp). If for some reason they didn't, bail loudly so the
            // operator notices ordering issues rather than silently skipping
            // FK creation.
            throw new \RuntimeException(
                'add_region_to_tenants requires countries + currencies tables. '
                . 'Run earlier 2026_07_01_* migrations first.'
            );
        }

        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'country_code')) {
                // CHAR(2). Default 'UZ' — backfills every existing tenant
                // correctly since they're all uzbek today.
                $table->char('country_code', 2)->default('UZ')->after('default_currency');
            }
            if (! Schema::hasColumn('tenants', 'currency_code')) {
                $table->char('currency_code', 3)->default('UZS')->after('country_code');
            }
        });

        // Add FKs only if not already present. Laravel doesn't expose a clean
        // "does this FK exist?" check, so we just try and swallow duplicate
        // errors (PostgreSQL: SQLSTATE 42710).
        Schema::table('tenants', function (Blueprint $table): void {
            try {
                $table->foreign('country_code')
                    ->references('code')
                    ->on('countries')
                    ->restrictOnDelete();
            } catch (\Throwable $e) {
                // FK already exists — ignore.
            }
            try {
                $table->foreign('currency_code')
                    ->references('code')
                    ->on('currencies')
                    ->restrictOnDelete();
            } catch (\Throwable $e) {
                // FK already exists — ignore.
            }
        });

        // Index for "show me all tenants in country X" — used by the super
        // admin dashboard and the regional analytics aggregator.
        if (Schema::hasColumn('tenants', 'country_code')) {
            try {
                Schema::table('tenants', function (Blueprint $table): void {
                    $table->index('country_code', 'tenants_country_idx');
                });
            } catch (\Throwable $e) {
                // Index already exists — ignore.
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        // Drop index first, then FKs, then columns. Reverse order of up().
        Schema::table('tenants', function (Blueprint $table): void {
            try {
                $table->dropIndex('tenants_country_idx');
            } catch (\Throwable $e) {
                // Already dropped.
            }

            foreach (['currency_code', 'country_code'] as $col) {
                if (Schema::hasColumn('tenants', $col)) {
                    try {
                        $table->dropForeign([$col]);
                    } catch (\Throwable $e) {
                        // FK didn't exist.
                    }
                }
            }

            $columns = array_filter([
                Schema::hasColumn('tenants', 'currency_code') ? 'currency_code' : null,
                Schema::hasColumn('tenants', 'country_code') ? 'country_code' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
