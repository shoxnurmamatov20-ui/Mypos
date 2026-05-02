<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\AI\Actions\AnalyzeRestaurantInsightsAction;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\InsightsRequest;
use App\Http\Resources\V1\Admin\InsightsResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Phase-4 — Claude-narrated business insights.
 *
 *   POST /api/v1/admin/ai/insights         [insights_narrative] Enterprise
 *
 * Burns AI tokens (~1500 in + 800 out per call). The {@see InsightsRequest}
 * enforces the Enterprise tier gate; the action is responsible for its own
 * AI quota check via the Anthropic client (Agent E2's `AiQuotaGuard`).
 *
 * The action is dispatched synchronously — the dashboard expects the
 * narrative within ~5s. If we later see latency issues we can flip this
 * to a queued job that pushes results via Reverb.
 */
class InsightsController extends Controller
{
    public function __construct(
        private readonly AnalyzeRestaurantInsightsAction $analyze,
    ) {
    }

    /** POST /api/v1/admin/ai/insights */
    public function store(InsightsRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        $result = ($this->analyze)($tenant, $request->locale());

        return response()->json([
            'data' => (new InsightsResource($result))->toArray($request),
        ]);
    }

    private function resolveTenant(InsightsRequest $request): Tenant
    {
        $user = $request->user();
        if ($user === null || $user->tenant_id === null) {
            throw new NotFoundHttpException('Tenant kontekstida emassiz');
        }
        $tenant = Tenant::query()->whereKey($user->tenant_id)->first();
        if ($tenant === null) {
            throw new NotFoundHttpException('Restoran topilmadi');
        }
        return $tenant;
    }
}
