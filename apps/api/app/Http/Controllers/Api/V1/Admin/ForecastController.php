<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\AI\Services\DemandForecastService;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\ForecastQueryRequest;
use App\Http\Resources\V1\Admin\ForecastPredictionResource;
use App\Http\Resources\V1\Admin\ForecastRetireResource;
use App\Http\Resources\V1\Admin\ForecastTopItemsResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Phase-4 — admin demand-forecast endpoints.
 *
 *   GET /api/v1/admin/ai/forecast/top-items     [forecast_basic]      Pro+
 *   GET /api/v1/admin/ai/forecast/predict-week  [forecast_predictive] Plus+
 *   GET /api/v1/admin/ai/forecast/low-sellers   [forecast_basic]      Pro+
 *
 * The tier gate is enforced by {@see ForecastQueryRequest::withValidator()}
 * — failure produces a 422 with a translated message, which the dashboard
 * surfaces as an "Upgrade your plan" CTA.
 *
 * Statistical only: this controller does NOT call the Anthropic API. Cost
 * accounting / `ai_generations_log` is not touched. For the Claude-narrated
 * version, see {@see InsightsController}.
 */
class ForecastController extends Controller
{
    public function __construct(
        private readonly DemandForecastService $forecast,
    ) {
    }

    /** GET /api/v1/admin/ai/forecast/top-items?days=30 */
    public function topItems(ForecastQueryRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $days = $request->trailingDays(DemandForecastService::DEFAULT_TOP_DAYS);

        $rows = $this->forecast->topItemsForRestaurant($tenant, $days);

        return response()->json([
            'data' => array_map(
                static fn (array $row) => (new ForecastTopItemsResource($row))->toArray($request),
                $rows,
            ),
            'meta' => [
                'days' => $days,
                'count' => count($rows),
            ],
        ]);
    }

    /** GET /api/v1/admin/ai/forecast/predict-week */
    public function predictWeek(ForecastQueryRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        $rows = $this->forecast->predictNextWeek($tenant);

        return response()->json([
            'data' => array_map(
                static fn (array $row) => (new ForecastPredictionResource($row))->toArray($request),
                $rows,
            ),
            'meta' => [
                'count' => count($rows),
            ],
        ]);
    }

    /** GET /api/v1/admin/ai/forecast/low-sellers?days=60 */
    public function lowSellers(ForecastQueryRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $days = $request->trailingDays(DemandForecastService::DEFAULT_RETIRE_DAYS);

        $rows = $this->forecast->lowSellersToRetire($tenant, $days);

        return response()->json([
            'data' => array_map(
                static fn (array $row) => (new ForecastRetireResource($row))->toArray($request),
                $rows,
            ),
            'meta' => [
                'days' => $days,
                'threshold' => DemandForecastService::RETIRE_THRESHOLD,
                'count' => count($rows),
            ],
        ]);
    }

    /**
     * Hydrate the authenticated user's tenant. The `tenant.admin` middleware
     * guarantees `tenant_id` is present, but we still firstOrFail to surface
     * a clean 404 if the row was deleted between auth and request.
     */
    private function resolveTenant(ForecastQueryRequest $request): Tenant
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
