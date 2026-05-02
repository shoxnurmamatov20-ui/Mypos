<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenant\Enums\SubmissionStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Http\Controllers\Controller;
use App\Jobs\SubmitToStoreJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restaurant-owner endpoints for *post-build* operations on a
 * {@see TenantAppBuild}: manual submission triggering and QR-code download
 * for internal-test installs.
 *
 * Lives separately from Agent D2's `AppController` (which owns the build
 * lifecycle CRUD) so the two agents can ship in parallel without merge
 * collisions. Once both land, both controllers route under the same
 * `/api/v1/admin/apps/{id}/builds/{buildId}/*` prefix.
 *
 * Auth: `tenant.admin` middleware = Sanctum + owner/manager role +
 * non-null tenant_id (see `bootstrap/app.php`). Per-action authorization
 * is delegated to `TenantAppPolicy` once Agent D2 ships it; for now we
 * gate with the tenant-membership check below.
 */
class BuildSubmissionController extends Controller
{
    /**
     * POST /api/v1/admin/apps/{id}/builds/{buildId}/submit
     *
     * Manually trigger store submission. Primary use case is the
     * `build_account=tenant` flow — the restaurant has uploaded the
     * artifact to their own developer account and now wants MyPOS to
     * mark the build as submitted.
     *
     * For `build_account=mypos` builds this is a re-trigger after a
     * transient API failure (the automatic dispatch already runs via
     * SubmitToStoreJob the moment the EAS webhook reports `finished`).
     */
    public function submit(Request $request, string $appId, string $buildId): JsonResponse
    {
        [$app, $build] = $this->resolveOwnedBuild($request, $appId, $buildId);

        // Owner-only: TenantAppPolicy::update is restricted to Owner role,
        // and submission is a high-impact action (sends to App Store / Play
        // Store under the tenant's brand). Manager can VIEW builds but not
        // submit — match the policy contract.
        $this->authorize('update', $app);

        if (! $build->canBeSubmitted()) {
            return response()->json([
                'errors' => [
                    'submission' => [
                        sprintf(
                            'Build is not eligible for submission (status=%s, submission_status=%s).',
                            $build->status,
                            $build->submission_status,
                        ),
                    ],
                ],
            ], Response::HTTP_CONFLICT);
        }

        // Dispatch on the queue — same path as the webhook-driven flow so
        // there's only one place that talks to Apple/Google.
        SubmitToStoreJob::dispatch($build->id);

        return response()->json([
            'data' => [
                'build_id' => $build->id,
                'submission_status' => SubmissionStatus::Pending->value,
                'queued' => true,
            ],
        ], Response::HTTP_ACCEPTED);
    }

    /**
     * GET /api/v1/admin/apps/{id}/builds/{buildId}/qr
     *
     * Returns the install QR-code URL for internal-test distribution
     * (TestFlight on iOS, Internal Testing track on Android).
     *
     * Response is intentionally a JSON envelope rather than a redirect so
     * the Filament UI can render the URL alongside instructions in all
     * three locales without burning a roundtrip.
     */
    public function qr(Request $request, string $appId, string $buildId): JsonResponse
    {
        [$app, $build] = $this->resolveOwnedBuild($request, $appId, $buildId);

        // QR install URL gives anyone-with-the-link the ability to install
        // an unfinished build. Restrict to owner.
        $this->authorize('view', $app);

        if ($build->qr_code_url === null || $build->qr_code_url === '') {
            return response()->json([
                'errors' => [
                    'qr' => ['QR code is not yet available for this build.'],
                ],
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => [
                'build_id' => $build->id,
                'platform' => $build->platform,
                'qr_code_url' => $build->qr_code_url,
                'submission_status' => $build->submission_status,
            ],
        ]);
    }

    /**
     * Resolve a (tenant_app, build) pair owned by the requesting tenant.
     * 404s are emitted instead of 403 so cross-tenant ID enumeration is
     * impossible — see DomainController for the same pattern.
     *
     * @return array{0: TenantApp, 1: TenantAppBuild}
     */
    private function resolveOwnedBuild(Request $request, string $appId, string $buildId): array
    {
        // BelongsToTenant scope auto-filters to the current tenant via
        // Auth::user()->tenant_id, so a cross-tenant ID returns null.
        $app = TenantApp::query()->whereKey($appId)->first();
        if ($app === null) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $build = TenantAppBuild::query()
            ->where('tenant_app_id', $app->id)
            ->whereKey($buildId)
            ->first();
        if ($build === null) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return [$app, $build];
    }
}
