<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Menu\MenuCategoryResource;
use App\Http\Resources\V1\Menu\MenuItemResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public (unauthenticated) menu endpoint — used by QR-scan PWA.
 *
 * Returns only active categories + items for the tenant.
 * Strictly filters by tenant slug; no cross-tenant leakage.
 */
class PublicMenuController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->whereNull('suspended_at')
            ->first();

        if ($tenant === null) {
            throw new NotFoundHttpException("Restoran topilmadi");
        }

        // Load active categories for this tenant (bypass tenant global scope —
        // no authenticated user in public context).
        $categories = MenuCategory::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $items = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => [
                'tenant' => [
                    'id' => $tenant->id,
                    'slug' => $tenant->slug,
                    'name' => $tenant->name,
                    'logo_url' => $tenant->logo_url,
                    'default_locale' => $tenant->default_locale,
                    'default_currency' => $tenant->default_currency,
                ],
                'categories' => MenuCategoryResource::collection($categories),
                'items' => MenuItemResource::collection($items),
            ],
        ]);
    }
}
