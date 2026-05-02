<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Services;

use App\Domain\Customer\Models\Customer;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use App\Domain\SuperAdmin\Models\AuditLog;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregates SaaS-wide KPIs across ALL tenants for the super-admin dashboard.
 * NEVER applies tenant scopes — always queries via withoutGlobalScopes().
 */
class DashboardKpiService
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function compute(): array
    {
        $now = now();

        return [
            'tenants' => $this->tenants($now),
            'revenue' => $this->revenue($now),
            'orders' => $this->orders($now),
            'users' => $this->users($now),
            'system' => $this->system($now),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function tenants(Carbon $now): array
    {
        /** @var array<string, int> $byStatus */
        $byStatus = Tenant::query()
            ->withoutGlobalScopes()
            ->select('subscription_status', DB::raw('count(*) as c'))
            ->groupBy('subscription_status')
            ->pluck('c', 'subscription_status')
            ->all();

        $total = (int) Tenant::query()->withoutGlobalScopes()->count();

        $growth30d = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->count();

        return [
            'total' => $total,
            'active' => (int) ($byStatus[SubscriptionStatus::Active->value] ?? 0),
            'trialing' => (int) ($byStatus[SubscriptionStatus::Trialing->value] ?? 0),
            'past_due' => (int) ($byStatus[SubscriptionStatus::PastDue->value] ?? 0),
            'suspended' => (int) ($byStatus[SubscriptionStatus::Suspended->value] ?? 0),
            'cancelled' => (int) ($byStatus[SubscriptionStatus::Cancelled->value] ?? 0),
            'growth_30d' => $growth30d,
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function revenue(Carbon $now): array
    {
        $mrrTotal = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->whereIn('subscription_status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trialing->value,
                SubscriptionStatus::PastDue->value,
            ])
            ->sum('mrr_minor');

        $payingCount = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->where('mrr_minor', '>', 0)
            ->count();

        $avgMrr = $payingCount > 0 ? (int) round($mrrTotal / $payingCount) : 0;

        $mrr30dAgo = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->where('created_at', '<', $now->copy()->subDays(30))
            ->whereIn('subscription_status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trialing->value,
                SubscriptionStatus::PastDue->value,
            ])
            ->sum('mrr_minor');

        $growth = $mrr30dAgo > 0
            ? round((($mrrTotal - $mrr30dAgo) / $mrr30dAgo) * 100, 2)
            : 0.0;

        return [
            'mrr_total_minor' => $mrrTotal,
            'arr_total_minor' => $mrrTotal * 12,
            'average_mrr_minor' => $avgMrr,
            'growth_30d_percent' => $growth,
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function orders(Carbon $now): array
    {
        $todayStart = $now->copy()->startOfDay();
        $yesterdayStart = $now->copy()->subDay()->startOfDay();
        $monthStart = $now->copy()->startOfMonth();

        $todayCount = (int) Order::query()
            ->withoutGlobalScopes()
            ->where('created_at', '>=', $todayStart)
            ->count();

        $todayRevenue = (int) Order::query()
            ->withoutGlobalScopes()
            ->where('created_at', '>=', $todayStart)
            ->whereIn('status', ['completed', 'served', 'delivered', 'paid'])
            ->sum('total_amount');

        $yesterdayCount = (int) Order::query()
            ->withoutGlobalScopes()
            ->whereBetween('created_at', [$yesterdayStart, $todayStart])
            ->count();

        $monthCount = (int) Order::query()
            ->withoutGlobalScopes()
            ->where('created_at', '>=', $monthStart)
            ->count();

        $growth = $yesterdayCount > 0
            ? round((($todayCount - $yesterdayCount) / $yesterdayCount) * 100, 2)
            : 0.0;

        return [
            'today_count' => $todayCount,
            'today_revenue_minor' => $todayRevenue,
            'yesterday_count' => $yesterdayCount,
            'growth_today_percent' => $growth,
            'this_month_count' => $monthCount,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function users(Carbon $now): array
    {
        $todayStart = $now->copy()->startOfDay();

        return [
            'total_customers' => (int) Customer::query()->withoutGlobalScopes()->count(),
            'total_employees' => (int) Employee::query()->withoutGlobalScopes()->count(),
            'active_today' => (int) User::query()
                ->where('last_login_at', '>=', $todayStart)
                ->count(),
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function system(Carbon $now): array
    {
        $errors24h = (int) AuditLog::query()
            ->whereIn('severity', ['error', 'critical'])
            ->where('created_at', '>=', $now->copy()->subDay())
            ->count();

        // Stable mocks until APM/metrics wiring is in place
        return [
            'errors_24h' => $errors24h,
            'avg_response_ms' => 145,
            'uptime_percent' => 99.97,
        ];
    }
}
