<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Kiosk\KioskTenantResource;
use App\Http\Resources\V1\Menu\MenuCategoryResource;
use App\Http\Resources\V1\Menu\MenuItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Returns the active menu for the kiosk's tenant. Mirrors the shape of
 * `/api/v1/public/menu/{slug}` so the kiosk PWA can reuse the same renderer.
 *
 * Cached in Redis for 60s per tenant — invalidated lazily; menu admin actions
 * should clear `kiosk:menu:{tenant_id}` on update for instant refresh.
 */
class KioskMenuController extends Controller
{
    private const CACHE_TTL_SECONDS = 60;

    public function index(Request $request): JsonResponse
    {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        $cacheKey = sprintf('kiosk:menu:%s', $device->tenant_id);

        $payload = Cache::remember(
            $cacheKey,
            self::CACHE_TTL_SECONDS,
            fn (): array => $this->buildMenuPayload($device, $request),
        );

        return response()->json($payload);
    }

    /** @return array{data: array<string, mixed>} */
    private function buildMenuPayload(KioskDevice $device, Request $request): array
    {
        $categories = MenuCategory::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $items = MenuItem::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return [
            'data' => [
                'tenant' => KioskTenantResource::make($device->tenant)->toArray($request),
                'categories' => MenuCategoryResource::collection($categories)->toArray($request),
                'items' => MenuItemResource::collection($items)->toArray($request),
            ],
        ];
    }
}
