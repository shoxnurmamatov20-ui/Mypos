<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CEO consolidated dashboard — KPIs across every tenant the user owns.
 *
 * All endpoints under `/api/v1/ceo/*` go through `EnsureCEO` middleware:
 *   - user has the `ceo` role
 *   - user owns ≥1 tenant via the `tenant_owners` pivot
 *
 * Cross-tenant queries use `withoutGlobalScopes(['tenant'])` because the CEO
 * is intentionally crossing the `BelongsToTenant` global scope — but always
 * pre-scoped by `ownedTenantIds()` so they only see their own restaurants.
 */
class DashboardController extends Controller
{
    /**
     * GET /api/v1/ceo/dashboard
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        $today = now()->startOfDay();
        $weekAgo = now()->subDays(7)->startOfDay();
        $monthAgo = now()->subDays(30)->startOfDay();

        $base = fn () => Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $tenantIds)
            ->where('status', 'completed');

        $todayRevenue = (int) $base()->where('created_at', '>=', $today)->sum('total_amount');
        $todayCount = (int) $base()->where('created_at', '>=', $today)->count();
        $weekRevenue = (int) $base()->where('created_at', '>=', $weekAgo)->sum('total_amount');
        $weekCount = (int) $base()->where('created_at', '>=', $weekAgo)->count();
        $monthRevenue = (int) $base()->where('created_at', '>=', $monthAgo)->sum('total_amount');
        $monthCount = (int) $base()->where('created_at', '>=', $monthAgo)->count();

        return response()->json([
            'data' => [
                'tenants_owned' => count($tenantIds),
                'metrics' => [
                    'today' => ['revenue_minor' => $todayRevenue, 'orders_count' => $todayCount],
                    'last_7_days' => ['revenue_minor' => $weekRevenue, 'orders_count' => $weekCount],
                    'last_30_days' => ['revenue_minor' => $monthRevenue, 'orders_count' => $monthCount],
                ],
                'currency' => 'UZS',
            ],
        ]);
    }

    /**
     * GET /api/v1/ceo/restaurants
     */
    public function restaurants(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $tenants = $user->ownedTenants()
            ->with('brand')
            ->get();

        $tenantIds = $tenants->pluck('id')->all();
        $today = now()->startOfDay();

        $rows = Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->select('tenant_id')
            ->selectRaw('SUM(total_amount) as revenue_minor')
            ->selectRaw('COUNT(*) as orders_count')
            ->whereIn('tenant_id', $tenantIds)
            ->where('status', 'completed')
            ->where('created_at', '>=', $today)
            ->groupBy('tenant_id')
            ->get();

        $todayStats = $rows->keyBy('tenant_id');

        $payload = $tenants->map(function (Tenant $tenant) use ($todayStats): array {
            $stats = $todayStats->get($tenant->id);
            return [
                'id' => $tenant->id,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
                'tier' => $tenant->tier ?? 'free',
                'status' => $tenant->status,
                'logo_url' => $tenant->logo_url,
                'is_primary' => (bool) ($tenant->pivot?->is_primary ?? false),
                'joined_at' => $tenant->pivot?->joined_at,
                'today' => [
                    'revenue_minor' => (int) ($stats?->revenue_minor ?? 0),
                    'orders_count' => (int) ($stats?->orders_count ?? 0),
                ],
            ];
        });

        return response()->json([
            'data' => $payload,
            'meta' => ['count' => $tenants->count()],
        ]);
    }

    /**
     * GET /api/v1/ceo/finances/summary
     */
    public function finances(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $tenantIds = $user->ownedTenantIds();

        $tenants = $user->ownedTenants()
            ->select('tenants.id', 'slug', 'name', 'subscription_plan', 'mrr_minor', 'total_revenue_minor')
            ->get();

        $totalMrr = (int) $tenants->sum('mrr_minor');
        $totalLifetimeRevenue = (int) $tenants->sum('total_revenue_minor');

        $thirtyDayRevenue = (int) Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->whereIn('tenant_id', $tenantIds)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('total_amount');

        return response()->json([
            'data' => [
                'mrr_minor' => $totalMrr,
                'last_30_days_revenue_minor' => $thirtyDayRevenue,
                'lifetime_revenue_minor' => $totalLifetimeRevenue,
                'by_tenant' => $tenants->map(fn (Tenant $t): array => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'subscription_plan' => $t->subscription_plan ?? null,
                    'mrr_minor' => (int) ($t->mrr_minor ?? 0),
                    'lifetime_revenue_minor' => (int) ($t->total_revenue_minor ?? 0),
                ]),
                'currency' => 'UZS',
            ],
        ]);
    }
}
