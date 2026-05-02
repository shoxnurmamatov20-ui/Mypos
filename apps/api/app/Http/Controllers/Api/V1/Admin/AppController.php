<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenant\Actions\GenerateNativeAppAction;
use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\EasBuildClient;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Admin\CreateAppRequest;
use App\Http\Requests\V1\Admin\UpdateAppRequest;
use App\Http\Resources\V1\Admin\AppBuildResource;
use App\Http\Resources\V1\Admin\AppResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restaurant-owner native-app management.
 *
 * Endpoints assume `tenant.admin` middleware (see routes/api.php). Per-record
 * authorization is delegated to {@see \App\Domain\Tenant\Policies\TenantAppPolicy}
 * and {@see \App\Domain\Tenant\Policies\TenantAppBuildPolicy}.
 *
 * Tier gate: only Enterprise tenants pass the FormRequest layer for create
 * and the Action layer for build. Pre-Enterprise calls receive 422/403.
 *
 * Soft delete: `destroy()` only succeeds when no live build exists for the
 * row. Restoring a soft-deleted app would re-claim the original bundle id —
 * supported by the `tenant_apps_bundle_uq` partial index.
 */
class AppController extends Controller
{
    public function __construct(
        private readonly GenerateNativeAppAction $generateApp,
    ) {
    }

    /** GET /api/v1/admin/apps — list tenant's apps. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TenantApp::class);

        $apps = TenantApp::query()
            ->with('latestBuild')
            ->orderBy('platform')
            ->orderByDesc('created_at')
            ->get();

        return AppResource::collection($apps);
    }

    /**
     * POST /api/v1/admin/apps — register a new platform-specific app config.
     *
     * After creation the row is in `draft`. The owner uploads icons / fills
     * marketing copy via PATCH, and finally calls POST /apps/{id}/build to
     * dispatch the first EAS Build.
     */
    public function store(CreateAppRequest $request): JsonResponse
    {
        $this->authorize('create', TenantApp::class);

        $tenant = $this->resolveTenant($request);
        $data = $request->validated();
        $data['tenant_id'] = $tenant->id;

        $app = new TenantApp();
        $app->forceFill($data)->save();

        return response()->json([
            'data' => AppResource::make($app->fresh() ?? $app),
        ], Response::HTTP_CREATED);
    }

    /** GET /api/v1/admin/apps/{id} */
    public function show(Request $request, string $id): JsonResponse
    {
        $app = $this->findOwnedApp($id);
        $this->authorize('view', $app);

        return response()->json([
            'data' => AppResource::make($app->load('latestBuild')),
        ]);
    }

    /** PATCH /api/v1/admin/apps/{id} */
    public function update(UpdateAppRequest $request, string $id): JsonResponse
    {
        $app = $this->findOwnedApp($id);
        $this->authorize('update', $app);

        $app->forceFill($request->validated())->save();

        return response()->json([
            'data' => AppResource::make($app->fresh()?->load('latestBuild') ?? $app),
        ]);
    }

    /**
     * DELETE /api/v1/admin/apps/{id}
     *
     * Only allowed when the row has no live build — deleting an app while
     * EAS is mid-build would leave an orphan job. Soft delete keeps history.
     */
    public function destroy(Request $request, string $id): JsonResponse|Response
    {
        $app = $this->findOwnedApp($id);
        $this->authorize('delete', $app);

        $hasLiveBuild = TenantAppBuild::query()
            ->where('tenant_app_id', $app->id)
            ->whereIn('status', [
                BuildStatus::Queued->value,
                BuildStatus::InProgress->value,
            ])
            ->exists();

        if ($hasLiveBuild) {
            return response()->json([
                'message' => __('Avval ishlayotgan buildni bekor qiling'),
            ], 422);
        }

        $app->delete();

        return response()->noContent();
    }

    /**
     * POST /api/v1/admin/apps/{id}/build
     *
     * Trigger a fresh EAS Build. The request returns immediately with the
     * newly-created `tenant_app_builds` row in `queued` state — actual
     * dispatch to EAS happens in {@see \App\Jobs\DispatchEasBuildJob}.
     */
    public function build(Request $request, string $id): JsonResponse
    {
        $app = $this->findOwnedApp($id);
        $this->authorize('build', $app);

        $platform = $request->input('platform', $app->platform instanceof \BackedEnum
            ? $app->platform->value
            : (string) $app->platform);

        // Defensive validation in case the caller passes an explicit override —
        // the FormRequest only fires on store/update. Inline rules keep the
        // single-purpose endpoint compact.
        $validated = $request->validate([
            'platform' => ['sometimes', 'string', Rule::in(AppPlatform::values())],
        ]);
        if (isset($validated['platform'])) {
            $platform = $validated['platform'];
        }

        $build = ($this->generateApp)($app, $platform);

        return response()->json([
            'data' => AppBuildResource::make($build),
        ], Response::HTTP_ACCEPTED);
    }

    /** GET /api/v1/admin/apps/{id}/builds — full build history (newest first). */
    public function builds(Request $request, string $id): AnonymousResourceCollection
    {
        $app = $this->findOwnedApp($id);
        $this->authorize('view', $app);

        $builds = TenantAppBuild::query()
            ->where('tenant_app_id', $app->id)
            ->orderByDesc('created_at')
            ->get();

        return AppBuildResource::collection($builds);
    }

    /**
     * POST /api/v1/admin/apps/{id}/builds/{buildId}/cancel
     *
     * Cancels an in-progress EAS build. We hit EAS first (best-effort), then
     * persist the local state — if EAS rejects the cancel (already-terminal
     * build) we still update our row so the UI doesn't keep polling.
     */
    public function cancelBuild(
        Request $request,
        string $id,
        string $buildId,
        EasBuildClient $client,
    ): JsonResponse {
        $app = $this->findOwnedApp($id);
        $this->authorize('cancel', $app);

        $build = TenantAppBuild::query()
            ->where('tenant_app_id', $app->id)
            ->whereKey($buildId)
            ->firstOrFail();

        $this->authorize('cancel', $build);

        if (in_array($build->status, [
            BuildStatus::Finished->value,
            BuildStatus::Failed->value,
            BuildStatus::Errored->value,
            BuildStatus::Canceled->value,
        ], true)) {
            // Already terminal — nothing to do, return current state.
            return response()->json([
                'data' => AppBuildResource::make($build),
            ]);
        }

        if ($build->eas_build_id !== null && $build->eas_build_id !== '') {
            // Best-effort: ignore EAS-side cancel failures so a stale local
            // row can still be flipped to `canceled`. The client logs the
            // error if it surfaces.
            try {
                $client->cancelBuild($build->eas_build_id);
            } catch (\Throwable) {
                // Swallowed by design — see method docblock.
            }
        }

        $build->forceFill([
            'status' => BuildStatus::Canceled->value,
            'finished_at' => now(),
        ])->save();

        return response()->json([
            'data' => AppBuildResource::make($build->fresh() ?? $build),
        ]);
    }

    private function findOwnedApp(string $id): TenantApp
    {
        return TenantApp::query()
            ->whereKey($id)
            ->firstOrFail();
    }

    private function resolveTenant(Request $request): Tenant
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        return Tenant::query()->whereKey($user->tenant_id)->firstOrFail();
    }
}
