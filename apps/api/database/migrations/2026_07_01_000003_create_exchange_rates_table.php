<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4 — Daily FX rate history.
 *
 * Source priority (Agent E2 will implement the fetcher):
 *   1. CBU   — Markaziy bank (cbu.uz) for UZS pairs.
 *   2. NBP   — Tojikistan central bank for TJS pairs.
 *   3. fixer — fixer.io fallback when above APIs are down.
 *   4. manual — operator-entered override (super admin only).
 *
 * One row per (from_currency, to_currency, rate_date). The unique constraint
 * prevents accidentally inserting the same day's rate twice when the cron
 * runs more than once.
 *
 * Why DECIMAL(18,8) for `rate`:
 *   - 8 decimal places: enough precision for 1 USD ≈ 12,800.123 UZS or
 *     1 UZS ≈ 0.00007812 USD without rounding errors propagating into
 *     totals.
 *   - 18 total digits: handles 9,999,999,999.99999999 max — orders of
 *     magnitude beyond any realistic FX rate.
 *
 * NO RLS — global lookup table. The same UZS→USD rate applies to every
 * tenant on a given date.
 *
 * Application layer convention: rate means "1 unit of from_currency equals
 * X units of to_currency". So UZS→USD on 2026-07-01 ≈ 0.00007812.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('exchange_rates')) {
            return;
        }

        Schema::create('exchange_rates', function (Blueprint $table): void {
            // BIGSERIAL — high-volume insert table (one row per pair per day,
            // multiplied by ~7 currencies-squared = ~49 rows/day, ~18k/year).
            // bigIncrements is fine; we don't need UUIDs since this isn't
            // tenant-scoped.
            $table->bigIncrements('id');

            // Both reference currencies.code. We don't allow rates to/from a
            // missing currency — restrict on delete (the operator must
            // explicitly archive a currency before its rates can be cleaned).
            $table->char('from_currency', 3);
            $table->char('to_currency', 3);

            // 1 from_currency = X to_currency. See class doc for precision
            // rationale.
            $table->decimal('rate', 18, 8);

            // Provider tag for debugging discrepancies. 32 chars covers any
            // realistic source name; defaults to 'cbu' (most rates will come
            // from there).
            $table->string('source', 32)->default('cbu');

            // The DATE the rate is effective for (CBU publishes at ~17:00
            // local time for the next business day). Stored as DATE not
            // TIMESTAMPTZ — the rate has no time-of-day semantics.
            $table->date('rate_date');

            // When OUR fetcher actually pulled it. Useful for SLA alerts
            // ("we haven't refreshed in 36 hours"). useCurrent() satisfies
            // MySQL strict mode; insert path always sets explicitly.
            $table->timestampTz('fetched_at')->useCurrent();

            // No updated_at — rows are effectively append-only. We keep
            // created_at because the bigSerial id alone doesn't tell you
            // when a backfill was run vs a live fetch.
            $table->timestampTz('created_at')->useCurrent();
        });

        // FKs added in a second pass after table creation (Laravel's
        // foreignChar() is awkward; doing it manually is clearer).
        Schema::table('exchange_rates', function (Blueprint $table): void {
            $table->foreign('from_currency')
                ->references('code')
                ->on('currencies')
                ->restrictOnDelete();
            $table->foreign('to_currency')
                ->references('code')
                ->on('currencies')
                ->restrictOnDelete();
        });

        // Indexes:
        //  - pair_date_uq: idempotent inserts (cron retry-safe).
        //  - date_idx:     "give me today's rates for all pairs" — common
        //                  hot path for order conversion.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_pair_date_uq
                ON exchange_rates (from_currency, to_currency, rate_date)
            ');
            // DESC index — we always want the LATEST rate first.
            DB::statement('
                CREATE INDEX IF NOT EXISTS exchange_rates_date_idx
                ON exchange_rates (rate_date DESC)
            ');
        } else {
            // SQLite/MySQL fallback for tests — no DESC, no IF NOT EXISTS,
            // but the unique constraint is still respected.
            Schema::table('exchange_rates', function (Blueprint $table): void {
                $table->unique(
                    ['from_currency', 'to_currency', 'rate_date'],
                    'exchange_rates_pair_date_uq'
                );
                $table->index('rate_date', 'exchange_rates_date_idx');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('exchange_rates')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS exchange_rates_date_idx');
            DB::statement('DROP INDEX IF EXISTS exchange_rates_pair_date_uq');
        }

        Schema::dropIfExists('exchange_rates');
    }
};
