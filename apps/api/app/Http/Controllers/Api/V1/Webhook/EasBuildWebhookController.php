<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Http\Controllers\Controller;
use App\Jobs\SubmitToStoreJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Receives build status updates from Expo Application Services.
 *
 * EAS sends a POST to this endpoint at every status transition with:
 *
 *   Headers:
 *     Content-Type: application/json
 *     expo-signature: sha1=<hex digest>
 *
 *   Body (representative shape — see sample at bottom of this file):
 *     {
 *       "id": "...",                       // EAS Build UUID
 *       "accountName": "mypos",
 *       "projectName": "mobile-consumer",
 *       "status": "finished",              // queued|in-progress|finished|failed|errored|canceled
 *       "platform": "ios",                 // ios|android
 *       "artifacts": {
 *         "buildUrl": "https://...",       // .ipa or .aab download
 *         "applicationArchiveUrl": "..."
 *       },
 *       "logsUrl": "https://expo.dev/...",
 *       "error": { "message": "...", "errorCode": "..." }
 *     }
 *
 * Security:
 *   - HMAC-SHA1 signature verification using EAS_WEBHOOK_SECRET.
 *   - Fail-closed: missing secret = 503 (mis-deployed env), bad signature = 403.
 *   - Throttled at the route level (120/min) to absorb retries while still
 *     being abuse-resistant.
 *   - No tenant scope context here — this endpoint is invoked by Expo's
 *     servers and lives outside the Sanctum auth chain. Tenant isolation is
 *     enforced via PostgreSQL RLS + explicit `withoutGlobalScopes()`.
 */
class EasBuildWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // ---- 1. Signature verification ---------------------------------
        $secret = config('eas.webhook_secret');
        if (! is_string($secret) || $secret === '') {
            // Fail-closed: never silently accept unsigned calls when the
            // env wasn't configured.
            Log::error('EasBuildWebhookController: webhook secret not configured');
            abort(Response::HTTP_SERVICE_UNAVAILABLE, 'EAS webhook secret not configured');
        }

        $signature = (string) $request->header('expo-signature', '');
        $expected = 'sha1=' . hash_hmac('sha1', $request->getContent(), $secret);
        if (! hash_equals($expected, $signature)) {
            Log::warning('EasBuildWebhookController: signature mismatch', [
                'eas_build_id' => $request->json('id'),
                'received_prefix' => substr($signature, 0, 12),
            ]);
            abort(Response::HTTP_FORBIDDEN, 'Signature mismatch');
        }

        // ---- 2. Locate the corresponding TenantAppBuild row ------------
        $payload = $request->json()->all();
        $easBuildId = $payload['id'] ?? null;
        if (! is_string($easBuildId) || $easBuildId === '') {
            // Malformed payload from EAS — return 422 so retries are bounded.
            return response()->json(
                ['errors' => ['payload' => 'missing build id']],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        // Bypass the BelongsToTenant scope: webhooks have no tenant context
        // and we already trust the signature.
        $build = TenantAppBuild::query()
            ->withoutGlobalScopes()
            ->where('eas_build_id', $easBuildId)
            ->first();

        if ($build === null) {
            // Could be a race (build row not yet committed) OR a duplicate /
            // out-of-band webhook. Return 404 + log so operators can see it,
            // but don't 500 — Expo retries on 5xx.
            Log::info('EasBuildWebhookController: unknown EAS build id', [
                'eas_build_id' => $easBuildId,
            ]);
            abort(Response::HTTP_NOT_FOUND);
        }

        // ---- 2b. Replay protection -------------------------------------
        // Pin the (eas_build_id, status) pair as processed for 7 days.
        // Without this, an attacker who captures a single legitimate
        // `finished` webhook can replay it and mutate `artifact_url` to
        // poison the store-submission pipeline.
        $rawStatusForReplay = isset($payload['status']) ? (string) $payload['status'] : 'queued';
        $replayKey = sprintf('eas:webhook:replay:%s:%s', $easBuildId, $rawStatusForReplay);
        if (! \Illuminate\Support\Facades\Cache::add($replayKey, '1', now()->addDays(7))) {
            // Already processed — ack without side effects so EAS stops retrying.
            Log::info('EasBuildWebhookController: replay suppressed', [
                'eas_build_id' => $easBuildId,
                'status' => $rawStatusForReplay,
            ]);
            return response()->json(['ok' => true, 'replayed' => true]);
        }

        // ---- 2c. Artifact URL pin --------------------------------------
        // Once we record an artifact_url, refuse to overwrite it on later
        // webhooks. This blocks the "flip URL to attacker payload" attack
        // even if the replay-key check above is somehow bypassed.
        $alreadyHasArtifact = is_string($build->artifact_url) && $build->artifact_url !== '';

        // ---- 3. Sync status onto the row -------------------------------
        $rawStatus = isset($payload['status']) ? (string) $payload['status'] : 'queued';
        $easStatus = BuildStatus::fromEas($rawStatus);

        $finishedAt = $easStatus->isTerminal() ? now() : null;
        $errorMessage = null;
        if (isset($payload['error']) && is_array($payload['error'])) {
            $errorMessage = isset($payload['error']['message']) && is_string($payload['error']['message'])
                ? $payload['error']['message']
                : null;
        }

        $build->forceFill([
            'status' => $easStatus->value,
            // Pin artifact_url after first non-empty value (replay defense).
            'artifact_url' => $alreadyHasArtifact
                ? $build->artifact_url
                : ($this->extractArtifactUrl($payload) ?? $build->artifact_url),
            'log_url' => isset($payload['logsUrl']) && is_string($payload['logsUrl'])
                ? $payload['logsUrl']
                : $build->log_url,
            'finished_at' => $build->finished_at ?? $finishedAt,
            'started_at' => $build->started_at ?? ($easStatus === BuildStatus::InProgress ? now() : null),
            'error_message' => $errorMessage ?? $build->error_message,
        ])->save();

        // ---- 4. Dispatch store submission on success -------------------
        // We dispatch a Job (not run inline) for two reasons:
        //   - Apple/Google API calls are slow + flaky; we don't want to block
        //     the webhook response to EAS (Expo retries on >5s timeouts).
        //   - The job pulls credentials per build_account, which depends on
        //     an authenticated tenant context we don't have here.
        if ($easStatus === BuildStatus::Finished) {
            SubmitToStoreJob::dispatch($build->id);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Pull the binary artifact URL out of EAS's payload. EAS has used a
     * couple of different keys over time (`artifacts.buildUrl` historically,
     * `artifacts.applicationArchiveUrl` in newer versions); prefer whichever
     * is present.
     *
     * @param array<string, mixed> $payload
     */
    private function extractArtifactUrl(array $payload): ?string
    {
        $artifacts = $payload['artifacts'] ?? null;
        if (! is_array($artifacts)) {
            return null;
        }

        foreach (['buildUrl', 'applicationArchiveUrl'] as $key) {
            $value = $artifacts[$key] ?? null;
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }
        return null;
    }
}
