<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Services\MrrBreakdownService;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SuperAdmin\TenantSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingController extends Controller
{
    public function subscriptions(Request $request): AnonymousResourceCollection
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

        return TenantSummaryResource::collection($tenants);
    }

    public function mrrBreakdown(MrrBreakdownService $service): JsonResponse
    {
        return response()->json(['data' => $service->compute()]);
    }
}
