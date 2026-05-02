<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\AI\Actions\AutoTranslateAction;
use App\Domain\AI\Actions\GenerateDescriptionAction;
use App\Domain\AI\Actions\GenerateMenuAction;
use App\Domain\AI\Exceptions\AiDisabledException;
use App\Domain\AI\Exceptions\AiQuotaExceededException;
use App\Domain\AI\Exceptions\AnthropicException;
use App\Domain\AI\Services\AiQuotaGuard;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\GenerateDescriptionAiRequest;
use App\Http\Requests\V1\Admin\GenerateMenuAiRequest;
use App\Http\Requests\V1\Admin\TranslateAiRequest;
use App\Http\Resources\V1\Admin\AiUsageResource;
use App\Http\Resources\V1\Admin\GeneratedMenuResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restaurant-owner AI surface.
 *
 * Routes (all under `/api/v1/admin/ai/*`, gated by `auth:sanctum + tenant.admin`):
 *
 *   POST /menu/generate    GenerateMenuAiRequest        → array<GeneratedMenuItem>
 *   POST /translate        TranslateAiRequest           → TranslationBundle
 *   POST /description      GenerateDescriptionAiRequest → TranslationBundle
 *   GET  /usage            (no body)                    → AiUsageResource
 *
 * Tier gate is enforced in two layers:
 *   1. The FormRequest's `withValidator()` rejects Free tenants with 422.
 *   2. {@see AiQuotaGuard} enforces the daily limit (Pro: 50, Plus: 500,
 *      Enterprise: unlimited). Exceeding the cap returns 429.
 *
 * Error handling:
 *   - AiDisabledException     → 503 (kill-switch / empty key)
 *   - AiQuotaExceededException → 429 + Retry-After header (next UTC midnight)
 *   - AnthropicException       → 502 (upstream failure)
 *   - Validation errors        → 422 (handled by Laravel)
 */
class AIController extends Controller
{
    public function __construct(
        private readonly GenerateMenuAction $generateMenu,
        private readonly AutoTranslateAction $autoTranslate,
        private readonly GenerateDescriptionAction $generateDescription,
        private readonly AiQuotaGuard $quotaGuard,
    ) {
    }

    /**
     * POST /menu/generate
     *
     * Body: { cuisine_type, item_count?, locales? }
     */
    public function generateMenu(GenerateMenuAiRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        return $this->wrapAi(function () use ($tenant, $request): JsonResponse {
            $this->quotaGuard->ensureWithinDailyLimit($tenant);

            $items = ($this->generateMenu)(
                tenant: $tenant,
                cuisineType: (string) $request->input('cuisine_type'),
                itemCount: (int) $request->input('item_count', 25),
                locales: $request->input('locales'),
            );

            return response()->json([
                'data' => [
                    'items' => GeneratedMenuResource::collection(collect($items)),
                ],
                'meta' => [
                    'count' => count($items),
                ],
            ]);
        });
    }

    /**
     * POST /translate
     *
     * Body: { source: string|object, source_locale, target_locales[] }
     */
    public function translate(TranslateAiRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        return $this->wrapAi(function () use ($tenant, $request): JsonResponse {
            $this->quotaGuard->ensureWithinDailyLimit($tenant);

            $bundle = ($this->autoTranslate)(
                source: $request->input('source'),
                sourceLocale: (string) $request->input('source_locale'),
                targetLocales: (array) $request->input('target_locales', []),
            );

            // Polymorphic response — collapse synthetic `_` key for single-string
            // callers so the dashboard doesn't have to special-case.
            $isSingle = is_string($request->input('source'));
            $payload = $isSingle
                ? ['translations' => $bundle->single()]
                : ['translations' => $bundle->translations];

            return response()->json([
                'data' => $payload,
            ]);
        });
    }

    /**
     * POST /description
     *
     * Body: { name: string|object, ingredients?, locales?, tone? }
     */
    public function description(GenerateDescriptionAiRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        return $this->wrapAi(function () use ($tenant, $request): JsonResponse {
            $this->quotaGuard->ensureWithinDailyLimit($tenant);

            $bundle = ($this->generateDescription)(
                name: $request->input('name'),
                ingredients: $request->input('ingredients'),
                locales: $request->input('locales'),
                tone: (string) $request->input('tone', 'appetizing'),
            );

            return response()->json([
                'data' => [
                    'description' => $bundle->single(),
                ],
            ]);
        });
    }

    /**
     * GET /usage
     *
     * Returns the tenant's today + month-to-date AI consumption + cost.
     */
    public function usage(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $snapshot = $this->quotaGuard->usageSnapshot($tenant);

        return response()->json([
            'data' => AiUsageResource::make($snapshot),
        ]);
    }

    /**
     * Wrap an AI-calling closure in uniform exception handling so every
     * endpoint returns the same envelope shape across the documented
     * 422 / 429 / 502 / 503 status codes.
     */
    private function wrapAi(\Closure $closure): JsonResponse
    {
        try {
            $result = $closure();
            // Closures are typed to return JsonResponse, but be defensive in
            // case a future refactor returns a raw array.
            return $result instanceof JsonResponse
                ? $result
                : response()->json($result);
        } catch (AiQuotaExceededException $e) {
            return response()->json([
                'errors' => [
                    [
                        'code' => 'ai_quota_exceeded',
                        'message' => __('Bugungi AI so\'rovlar limiti tugadi'),
                        'meta' => [
                            'tier' => $e->tier,
                            'used_today' => $e->usedToday,
                            'daily_limit' => $e->dailyLimit,
                        ],
                    ],
                ],
            ], Response::HTTP_TOO_MANY_REQUESTS, [
                'Retry-After' => (string) max(60, now()->endOfDay()->diffInSeconds(now())),
            ]);
        } catch (AiDisabledException $e) {
            return response()->json([
                'errors' => [[
                    'code' => 'ai_disabled',
                    'message' => __('AI xizmati hozirda yoqilmagan'),
                ]],
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (AnthropicException $e) {
            return response()->json([
                'errors' => [[
                    'code' => 'ai_upstream_error',
                    'message' => __('AI provayder bilan ulanishda xato'),
                ]],
            ], Response::HTTP_BAD_GATEWAY);
        }
    }

    private function resolveTenant(Request $request): Tenant
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        return Tenant::query()->whereKey($user->tenant_id)->firstOrFail();
    }
}
