<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenant\Actions\UpdateBrandAction;
use App\Domain\Tenant\Actions\UploadBrandImageAction;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantBrand;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\UpdateBrandRequest;
use App\Http\Requests\V1\Admin\UploadBrandImageRequest;
use App\Http\Resources\V1\Admin\BrandResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Restaurant-owner branding management.
 *
 * All endpoints assume `tenant.admin` middleware: the authenticated user has
 * a non-null `tenant_id` and an owner/manager role. Per-record authorization
 * (`view`, `update`) is delegated to {@see TenantBrandPolicy}.
 */
class BrandController extends Controller
{
    public function __construct(
        private readonly UpdateBrandAction $updateBrand,
        private readonly UploadBrandImageAction $uploadImage,
    ) {
    }

    /**
     * GET /api/v1/admin/brand — return the tenant's brand row.
     *
     * Auto-creates a default row if none exists so the dashboard never has to
     * special-case "first visit" — the response shape is identical whether
     * the owner has touched their brand or not.
     */
    public function show(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        $brand = TenantBrand::query()
            ->withoutGlobalScopes(['tenant'])
            ->firstOrCreate(
                ['tenant_id' => $tenant->id],
                UpdateBrandAction::defaults($tenant->id),
            );

        $this->authorize('view', $brand);

        return response()->json([
            'data' => BrandResource::make($brand),
        ]);
    }

    /**
     * PATCH /api/v1/admin/brand — partial update.
     */
    public function update(UpdateBrandRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        $brand = TenantBrand::query()
            ->withoutGlobalScopes(['tenant'])
            ->firstOrCreate(
                ['tenant_id' => $tenant->id],
                UpdateBrandAction::defaults($tenant->id),
            );

        $this->authorize('update', $brand);

        $brand = $this->updateBrand->execute($tenant, $request->validated());

        return response()->json([
            'data' => BrandResource::make($brand),
        ]);
    }

    /** POST /api/v1/admin/brand/logo — upload logo image. */
    public function uploadLogo(UploadBrandImageRequest $request): JsonResponse
    {
        return $this->uploadSlot($request, 'logo');
    }

    /** POST /api/v1/admin/brand/cover */
    public function uploadCover(UploadBrandImageRequest $request): JsonResponse
    {
        return $this->uploadSlot($request, 'cover');
    }

    /** POST /api/v1/admin/brand/hero */
    public function uploadHero(UploadBrandImageRequest $request): JsonResponse
    {
        return $this->uploadSlot($request, 'hero');
    }

    /** POST /api/v1/admin/brand/favicon */
    public function uploadFavicon(UploadBrandImageRequest $request): JsonResponse
    {
        return $this->uploadSlot($request, 'favicon');
    }

    private function uploadSlot(UploadBrandImageRequest $request, string $slot): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        $brand = TenantBrand::query()
            ->withoutGlobalScopes(['tenant'])
            ->firstOrCreate(
                ['tenant_id' => $tenant->id],
                UpdateBrandAction::defaults($tenant->id),
            );

        $this->authorize('update', $brand);

        $file = $request->uploadedFile();
        if ($file === null) {
            // Mirror Laravel's standard 422 envelope for missing files.
            return response()->json([
                'message' => __('Rasm fayli yuborilmadi'),
                'errors' => ['logo' => [__('Rasm fayli yuborilmadi')]],
            ], 422);
        }

        $result = $this->uploadImage->execute($tenant, $slot, $file);

        // Top-level URL key follows `{slot}_url` so callers can pluck the
        // value without needing to map slot → column. The full brand row is
        // also included so dashboards can render the new state without a
        // round-trip back to GET /admin/brand.
        return response()->json([
            'data' => [
                $result['column'] => $result['url'],
                'slot' => $result['slot'],
                'url' => $result['url'],
                'brand' => BrandResource::make($result['brand']),
            ],
        ]);
    }

    /**
     * Resolve the active Tenant for the authenticated user. The middleware
     * guarantees `tenant_id` is non-null, but we still hydrate the model so
     * downstream callers can read `slug`, `tier`, etc.
     */
    private function resolveTenant(Request $request): Tenant
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        return Tenant::query()->whereKey($user->tenant_id)->firstOrFail();
    }
}
