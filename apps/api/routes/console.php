<?php

use App\Jobs\PollBuildStatusJob;
use App\Jobs\PollSubmissionStatusJob;
use App\Jobs\SyncFxRatesJob;
use App\Jobs\SyncSslStatusJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Retention: delete courier_locations rows older than 7 days.
 * Uses the (recorded_at) range partitioning to make this O(1) per partition;
 * the daily DELETE only touches recent rows.
 */
Artisan::command('retention:courier-locations', function () {
    $deleted = DB::table('courier_locations')
        ->where('recorded_at', '<', now()->subDays(7))
        ->delete();
    Log::info('retention:courier-locations executed', ['deleted' => $deleted]);
    $this->info("Deleted {$deleted} stale courier_locations rows.");
})->purpose('Delete courier_locations rows older than 7 days');

/**
 * Retention: delete notifications_log rows older than 90 days.
 * Uses notifications_log_retention_idx for index-only scan.
 */
Artisan::command('retention:notifications-log', function () {
    $deleted = DB::table('notifications_log')
        ->where('created_at', '<', now()->subDays(90))
        ->delete();
    Log::info('retention:notifications-log executed', ['deleted' => $deleted]);
    $this->info("Deleted {$deleted} stale notifications_log rows.");
})->purpose('Delete notifications_log rows older than 90 days');

Schedule::command('retention:courier-locations')->dailyAt('03:00')->onOneServer();
Schedule::command('retention:notifications-log')->dailyAt('03:30')->onOneServer();

/**
 * Hourly: refresh `tenant_domains.ssl_status` from Caddy / live HTTPS probes.
 * Bounded to a single instance via `onOneServer()` so multi-node Coolify
 * deploys don't fan out the same sweep, and `withoutOverlapping()` so a slow
 * DNS lookup (per-row 4s timeout) cannot stack a second sweep on top of the
 * first.
 */
Schedule::job(new SyncSslStatusJob())
    ->hourly()
    ->onOneServer()
    ->withoutOverlapping(20)
    ->name('tenant-domains:sync-ssl');

/**
 * Phase 3 — every 5 minutes, sync `tenant_app_builds.status` with EAS.
 * Webhooks from EAS are the primary signal; this is the safety net for
 * dropped notifications. `onOneServer()` so Coolify's multi-node deploy
 * does not duplicate API hits, `withoutOverlapping()` so a slow EAS
 * response cannot stack a second sweep on top of the first.
 */
Schedule::job(new PollBuildStatusJob())
    ->everyFiveMinutes()
    ->onOneServer()
    ->withoutOverlapping(10)
    ->name('eas:poll-builds');

/**
 * Phase 3 — hourly: progress App Store / Play Console review status from
 * `submitted` → `in_review` → `approved | rejected`. Apple/Google don't push
 * notifications when reviews change state — we have to poll. Hourly is a
 * reasonable cadence (Apple median review SLA is 24-48h; Google internal
 * testing is minutes-to-hours).
 */
Schedule::job(new PollSubmissionStatusJob())
    ->hourly()
    ->onOneServer()
    ->withoutOverlapping(20)
    ->name('store:poll-submissions');

/**
 * Phase 4 — daily FX rate sync at 02:00 server time.
 *
 * Runs after each Central-Asian central bank's overnight refresh window
 * (CBU publishes ~17:00 the prior business day, but we wait until 02:00 to
 * be sure all upstreams are settled). Idempotent — re-running on the same
 * day overwrites that day's rates via the unique
 * (from_currency, to_currency, rate_date) index.
 *
 * `onOneServer()` because we're hitting external APIs and want exactly one
 * worker per day, not N copies fighting for a fixer.io quota.
 *
 * `withoutOverlapping(60)` so a slow upstream cannot stack two sweeps on
 * top of each other — fixer.io rate-limits aggressively.
 */
Schedule::job(new SyncFxRatesJob())
    ->dailyAt('02:00')
    ->onOneServer()
    ->withoutOverlapping(60)
    ->name('fx:sync-rates');
