<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services\Concerns;

use Illuminate\Support\Carbon;

/**
 * Shared helper that turns optional `from`/`to` input dates into a
 * tenant-timezone-respecting Carbon range. Centralised so every report
 * picks the same defaults (last 30 days) when callers omit the range,
 * and so we never accidentally compare a date column to a datetime
 * boundary that excludes one end of the window.
 */
trait NormalizesDateRange
{
    /**
     * Returns the report's local timezone. UZ-based product → Asia/Tashkent.
     * Future per-tenant override: read from `tenant.timezone` column.
     */
    protected function reportTimezone(): string
    {
        return config('app.report_timezone', 'Asia/Tashkent');
    }

    /**
     * Turn user-supplied YYYY-MM-DD strings into a UTC datetime window
     * anchored to LOCAL midnight of the report timezone.
     *
     * Example: `from=2026-05-28` in Tashkent means
     *   2026-05-28 00:00:00+05  →  2026-05-27 19:00:00 UTC
     * which is what we store in `created_at`. Without this normalization
     * a Z-Report run at 22:00 Tashkent on the 28th would miss orders placed
     * 00:00–05:00 local on that day.
     *
     * @return array{0: Carbon, 1: Carbon}  [from, to] — both in UTC
     */
    protected function normalizeRange(?string $from, ?string $to): array
    {
        $tz = $this->reportTimezone();

        $toCarbon = $to !== null && $to !== ''
            ? Carbon::parse($to, $tz)->endOfDay()->utc()
            : Carbon::now($tz)->endOfDay()->utc();

        $fromCarbon = $from !== null && $from !== ''
            ? Carbon::parse($from, $tz)->startOfDay()->utc()
            : Carbon::now($tz)->subDays(29)->startOfDay()->utc();

        return [$fromCarbon, $toCarbon];
    }

    /**
     * Driver-agnostic SQL expression that buckets `created_at` by day,
     * week or month. Returns a `YYYY-MM-DD` string per row (week buckets
     * resolve to the Monday of that ISO week, month buckets to the 1st).
     *
     * Both Postgres (used in tests) and MySQL 8.x (used in prod) implement
     * the functions referenced below.
     */
    protected function periodExpression(string $column, string $groupBy, string $driver): string
    {
        $groupBy = in_array($groupBy, ['day', 'week', 'month'], true) ? $groupBy : 'day';

        if ($driver === 'pgsql') {
            return match ($groupBy) {
                'week' => "TO_CHAR(DATE_TRUNC('week', {$column}), 'YYYY-MM-DD')",
                'month' => "TO_CHAR(DATE_TRUNC('month', {$column}), 'YYYY-MM-DD')",
                default => "TO_CHAR({$column}, 'YYYY-MM-DD')",
            };
        }

        // MySQL / MariaDB
        return match ($groupBy) {
            'week' => "DATE_FORMAT(DATE_SUB({$column}, INTERVAL WEEKDAY({$column}) DAY), '%Y-%m-%d')",
            'month' => "DATE_FORMAT({$column}, '%Y-%m-01')",
            default => "DATE_FORMAT({$column}, '%Y-%m-%d')",
        };
    }
}
