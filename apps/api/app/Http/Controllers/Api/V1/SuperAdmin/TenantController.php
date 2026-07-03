<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\Order\Models\Order;
use App\Domain\SuperAdmin\Actions\CreateTenantAction;
use App\Domain\SuperAdmin\Actions\ImpersonateTenantAction;
use App\Domain\SuperAdmin\Actions\ResumeTenantAction;
use App\Domain\SuperAdmin\Actions\SuspendTenantAction;
use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Models\AuditLog;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SuperAdmin\CreateTenantRequest;
use App\Http\Requests\V1\SuperAdmin\SuspendTenantRequest;
use App\Http\Requests\V1\SuperAdmin\UpdateTenantRequest;
use App\Http\Resources\V1\SuperAdmin\AuditLogResource;
use App\Http\Resources\V1\SuperAdmin\TenantDetailResource;
use App\Http\Resources\V1\SuperAdmin\TenantSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TenantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $status = (string) $request->query('status', '');
        $plan = (string) $request->query('plan', '');
        $q = trim((string) $request->query('q', ''));
        $sort = (string) $request->query('sort', 'created_at:desc');

        $query = Tenant::query()->withoutGlobalScopes();

        if ($status !== '') {
            $query->where(function ($qq) use ($status): void {
                $qq->where('subscription_status', $status)
                    ->orWhere('status', $status);
            });
        }
        if ($plan !== '') {
            $query->where(function ($qq) use ($plan): void {
                $qq->where('subscription_plan', $plan)
                    ->orWhere('plan', $plan);
            });
        }
        if ($q !== '') {
            $like = '%' . $q . '%';
            // Case-insensitive on PostgreSQL needs ILIKE (MySQL's utf8mb4
            // collation made plain LIKE case-insensitive; PG does not).
            $op = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($qq) use ($like, $op): void {
                $qq->where('slug', $op, $like)
                    ->orWhere('name', $op, $like)
                    ->orWhere('email', $op, $like);
            });
        }

        [$sortCol, $sortDir] = $this->parseSort($sort);
        $query->orderBy($sortCol, $sortDir);

        // Bulk-resolve owners in O(1) extra query instead of O(N) per tenant.
        $tenants = $query->paginate($perPage);
        $tenantIds = collect($tenants->items())->pluck('id')->all();
        $ownerMap = app(\App\Domain\SuperAdmin\Services\TenantOwnerResolver::class)->mapByTenantIds($tenantIds);
        $tenants->getCollection()->transform(function (Tenant $t) use ($ownerMap): Tenant {
            $t->setRelation('owner', $ownerMap[$t->id] ?? null);
            return $t;
        });

        return TenantSummaryResource::collection($tenants);
    }

    public function show(string $tenantId): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $owner = $this->resolveOwner($tenant);

        $now = now();
        $todayStart = $now->copy()->startOfDay();
        $monthAgo = $now->copy()->subDays(30);

        $stats = [
            'employees_count' => (int) \App\Domain\Employee\Models\Employee::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->count(),
            'orders_today' => (int) Order::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('created_at', '>=', $todayStart)
                ->count(),
            'orders_30d' => (int) Order::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('created_at', '>=', $monthAgo)
                ->count(),
            'revenue_30d_minor' => (int) Order::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('created_at', '>=', $monthAgo)
                ->whereIn('status', ['completed', 'served', 'delivered', 'paid'])
                ->sum('total_amount'),
        ];

        $recentAudit = AuditLog::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $subscriptionHistory = AuditLog::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('action', [
                'tenant.created', 'tenant.suspended', 'tenant.resumed',
                'tenant.plan_changed', 'tenant.subscription_renewed',
            ])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => [
                'tenant' => TenantDetailResource::make($tenant),
                'owner' => $owner === null ? null : [
                    'id' => $owner->uuid,
                    'name' => $owner->name,
                    'email' => $owner->email,
                    'phone' => $owner->phone,
                ],
                'stats' => $stats,
                'subscription_history' => AuditLogResource::collection($subscriptionHistory),
                'recent_audit' => AuditLogResource::collection($recentAudit),
            ],
        ]);
    }

    public function store(CreateTenantRequest $request, CreateTenantAction $create): JsonResponse
    {
        $result = $create($request->user(), $request->validated());

        $result['tenant']->setRelation('owner', $result['owner']);

        return response()->json([
            'data' => [
                'tenant' => TenantDetailResource::make($result['tenant']),
                'owner' => [
                    'id' => $result['owner']->uuid,
                    'name' => $result['owner']->name,
                    'email' => $result['owner']->email,
                ],
            ],
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateTenantRequest $request, string $tenantId): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $payload = $request->validated();

        // Keep legacy status/plan in sync with subscription_status/plan
        if (isset($payload['plan']) && ! isset($payload['subscription_plan'])) {
            $payload['subscription_plan'] = $payload['plan'];
        }
        if (isset($payload['subscription_plan']) && ! isset($payload['plan'])) {
            $payload['plan'] = $payload['subscription_plan'];
        }
        if (isset($payload['subscription_status']) && ! isset($payload['status'])) {
            $payload['status'] = $payload['subscription_status'];
        }

        $tenant->forceFill($payload)->save();

        AuditLogger::log('tenant.updated', [
            'actor_user' => $request->user(),
            'tenant_id' => $tenant->id,
            'subject_type' => 'tenant',
            'subject_id' => $tenant->id,
            'subject_label' => $tenant->name,
            'severity' => AuditSeverity::Info->value,
            'metadata' => ['changes' => $payload],
        ]);

        return response()->json([
            'data' => TenantDetailResource::make($tenant->fresh()),
        ]);
    }

    public function destroy(Request $request, string $tenantId): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $name = $tenant->name;
        $tenant->delete();

        AuditLogger::log('tenant.deleted', [
            'actor_user' => $request->user(),
            'tenant_id' => $tenantId,
            'subject_type' => 'tenant',
            'subject_id' => $tenantId,
            'subject_label' => $name,
            'severity' => AuditSeverity::Warning->value,
        ]);

        return response()->json([
            'data' => ['message' => __('Tenant o\'chirildi')],
        ]);
    }

    public function suspend(SuspendTenantRequest $request, string $tenantId, SuspendTenantAction $action): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $tenant = $action($request->user(), $tenant, $request->validated());

        return response()->json([
            'data' => TenantDetailResource::make($tenant),
        ]);
    }

    public function resume(Request $request, string $tenantId, ResumeTenantAction $action): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $tenant = $action($request->user(), $tenant);

        return response()->json([
            'data' => TenantDetailResource::make($tenant),
        ]);
    }

    public function impersonate(Request $request, string $tenantId, ImpersonateTenantAction $action): JsonResponse
    {
        $tenant = Tenant::query()->withoutGlobalScopes()->findOrFail($tenantId);
        $result = $action($request->user(), $tenant);

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->uuid,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                    'tenant_id' => $result['user']->tenant_id,
                ],
                'tenant' => TenantDetailResource::make($result['tenant']),
                'expires_at' => $result['expires_at']->toIso8601String(),
            ],
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function parseSort(string $sort): array
    {
        $allowed = [
            'created_at', 'updated_at', 'mrr_minor',
            'total_orders_count', 'total_revenue_minor',
            'last_active_at', 'name', 'slug',
        ];
        $parts = explode(':', $sort, 2);
        $col = in_array($parts[0] ?? '', $allowed, true) ? $parts[0] : 'created_at';
        $dir = strtolower($parts[1] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        return [$col, $dir];
    }

    private function resolveOwner(Tenant $tenant): ?\App\Models\User
    {
        $candidates = \App\Models\User::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_super_admin', false)
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get();

        $owner = $candidates->first(fn ($u): bool => $u->hasRole('owner'));
        return $owner ?? $candidates->first();
    }

    /**
     * Bulk-resolve owners for many tenants in 1-2 queries (no N+1).
     *
     * @param  array<string>  $tenantIds
     * @return array<string, \App\Models\User>
     */
}
