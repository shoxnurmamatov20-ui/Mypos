<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Services\MrrBreakdownService;
use App\Domain\SuperAdmin\Services\TenantOwnerResolver;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SuperAdmin\TenantSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingController extends Controller
{
    public function subscriptions(Request $request, TenantOwnerResolver $owners): AnonymousResourceCollection
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $status = (string) $request->query('status', '');
        $plan = (string) $request->query('plan', '');

        $query = Tenant::query()->withoutGlobalScopes();

        if ($status !== '') {
            $query->where('subscription_status', $status);
        }
        if ($plan !== '') {
            $query->where('subscription_plan', $plan);
        }

        $tenants = $query->orderByDesc('mrr_minor')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // Bulk-resolve owners in O(1) extra query instead of O(N) per tenant.
        $ownerMap = $owners->mapByTenantIds(
            collect($tenants->items())->pluck('id')->all(),
        );
        $tenants->getCollection()->transform(function (Tenant $t) use ($ownerMap): Tenant {
            $t->setRelation('owner', $ownerMap[$t->id] ?? null);

            return $t;
        });

        return TenantSummaryResource::collection($tenants);
    }

    public function mrrBreakdown(MrrBreakdownService $service): JsonResponse
    {
        return response()->json(['data' => $service->compute()]);
    }

    /**
     * Invoice ledger. No invoicing engine exists yet (subscriptions are
     * charged out-of-band), so this returns the stable empty contract the
     * panel renders an honest empty state from — replacing the fabricated
     * fixture rows it used to show. Shape per row, once the ledger lands:
     * { id, number, tenant_id, tenant_name, amount_minor, status
     *   (paid|pending|failed), issued_at, paid_at, due_at }.
     */
    public function invoices(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => [
                'total' => 0,
                'per_page' => max(1, min(100, (int) $request->query('per_page', 25))),
                'current_page' => 1,
                'last_page' => 1,
            ],
        ]);
    }
}
