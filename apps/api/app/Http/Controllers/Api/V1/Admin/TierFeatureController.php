<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Admin\TierFeaturesResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/admin/tier-features
 *
 * Returns the feature matrix for the authenticated tenant's tier so the
 * dashboard can hide / disable controls without round-tripping. The matrix
 * is sourced from {@see \App\Domain\Tenant\Services\TierFeatures}.
 */
class TierFeatureController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $tenant = Tenant::query()->whereKey($user->tenant_id)->firstOrFail();

        return response()->json([
            'data' => TierFeaturesResource::make($tenant),
        ]);
    }
}
