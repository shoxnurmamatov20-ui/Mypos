<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Services;

use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Time-series data for the SaaS dashboard charts. Always queries across all
 * tenants (super-admin scope). Date arithmetic is portable to Postgres + SQLite
 * by using DATE() casts and grouping on the result.
 */
class DashboardChartsService
{
    /**
     * @param 7d|30d|90d|1y|string $range
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function compute(string $range = '30d'): array
    {
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            '1y' => 365,
            default => 30,
        };

        $end = now()->endOfDay();
        $start = now()->copy()->subDays($days - 1)->startOfDay();

        return [
            'revenue_by_day' => $this->revenueByDay($start, $end),
            'signups_by_day' => $this->signupsByDay($start, $end),
            'orders_by_day' => $this->ordersByDay($start, $end),
            'tenants_by_plan' => $this->tenantsByPlan(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function revenueByDay(Carbon $start, Carbon $end): array
    {
        $rows = Order::query()
            ->withoutGlobalScopes()
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('status', ['completed', 'served', 'delivered', 'paid'])
            ->select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('SUM(total_amount) as revenue'),
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return $this->fillDailySeries($start, $end, $rows, 'revenue', 'revenue_minor');
    }

    /** @return array<int, array<string, mixed>> */
    private function signupsByDay(Carbon $start, Carbon $end): array
    {
        $rows = Tenant::query()
            ->withoutGlobalScopes()
            ->whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return $this->fillDailySeries($start, $end, $rows, 'count', 'count');
    }

    /** @return array<int, array<string, mixed>> */
    private function ordersByDay(Carbon $start, Carbon $end): array
    {
        $rows = Order::query()
            ->withoutGlobalScopes()
            ->whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return $this->fillDailySeries($start, $end, $rows, 'count', 'count');
    }

    /** @return array<int, array<string, mixed>> */
    private function tenantsByPlan(): array
    {
        return Tenant::query()
            ->withoutGlobalScopes()
            ->select('subscription_plan', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan')
            ->orderBy('subscription_plan')
            ->get()
            ->map(fn ($r): array => [
                'plan' => (string) $r->subscription_plan,
                'count' => (int) $r->count,
            ])
            ->all();
    }

    /**
     * Fills the date range with zero-valued rows where there is no data.
     *
     * @param iterable<object{day: string|\Illuminate\Support\Carbon}> $rows
     *
     * @return array<int, array<string, mixed>>
     */
    private function fillDailySeries(
        Carbon $start,
        Carbon $end,
        iterable $rows,
        string $sourceCol,
        string $outKey,
    ): array {
        $byDay = [];
        foreach ($rows as $row) {
            $day = is_string($row->day) ? substr($row->day, 0, 10) : Carbon::parse($row->day)->toDateString();
            $byDay[$day] = (int) $row->{$sourceCol};
        }

        $out = [];
        $cursor = $start->copy()->startOfDay();
        while ($cursor->lte($end)) {
            $iso = $cursor->toDateString();
            $out[] = [
                'date' => $iso,
                $outKey => $byDay[$iso] ?? 0,
            ];
            $cursor->addDay();
        }
        return $out;
    }
}
