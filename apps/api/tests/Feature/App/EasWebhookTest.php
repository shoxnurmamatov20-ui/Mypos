<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — EAS Build webhook
|--------------------------------------------------------------------------
|
| Spec covered (Agent D3 — `App\Http\Controllers\Api\V1\Webhook\EasBuildWebhookController`):
|
|   POST /api/v1/webhooks/eas-build
|   Headers: expo-signature: sha1=<hex>   (HMAC-SHA1 of body, key = EAS_WEBHOOK_SECRET)
|
|   - 503 when the secret is not configured.
|   - 403 when the signature is missing.
|   - 403 when the signature is invalid.
|   - 200 when a valid signature is presented.
|   - Updates the matching `tenant_app_builds` row's `status` from EAS payload.
|   - Sets `finished_at` when the new status is terminal.
|   - Dispatches `SubmitToStoreJob` only when status === finished.
|   - Does NOT dispatch SubmitToStoreJob on failed/errored/canceled.
|   - Returns 404 when no row matches `eas_build_id`.
|   - Throttle middleware caps at 120/min.
|
| The controller bypasses the BelongsToTenant scope via `withoutGlobalScopes()`
| (no tenant context in webhook traffic) — these tests confirm that.
*/

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Jobs\SubmitToStoreJob;
use Illuminate\Support\Facades\Bus;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');

    if (! \Illuminate\Support\Facades\Route::has('v1.webhooks.eas_build')) {
        $this->markTestSkipped('EAS webhook route not yet wired (pending Agent D3 / route).');
    }
    if (! class_exists(TenantApp::class) || ! class_exists(TenantAppBuild::class)) {
        $this->markTestSkipped('TenantApp / TenantAppBuild not yet shipped (pending Agent D1).');
    }

    // Default: secret configured, every test that wants to exercise the
    // 503-fallback branch overrides this back to null.
    config(['eas.webhook_secret' => 'test-webhook-secret-aaaaaaaaaa']);
});

/**
 * Helper: build a tenant + app + build whose `eas_build_id` matches the
 * payload we'll POST. Returns the build for downstream assertions.
 *
 * Authenticates as the tenant owner so subsequent `$build->fresh()` reads
 * pass the BelongsToTenant scope. The webhook controller itself uses
 * `withoutGlobalScopes()` and is unaffected.
 */
function makeWebhookBuild(string $easBuildId, string $platform = 'ios'): TenantAppBuild
{
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);

    $owner = actingAsTenantOwner($tenant);
    \Illuminate\Support\Facades\Auth::login($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => $platform,
        'app_name' => 'Webhook Test',
        'bundle_id' => 'uz.webhook.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
        'apple_app_id' => 1234567890,
    ])->save();

    return TenantAppBuild::query()->create([
        'tenant_id' => $tenant->id,
        'tenant_app_id' => $app->id,
        'platform' => $platform,
        'status' => BuildStatus::Queued->value,
        'submission_status' => 'pending',
        'version' => '1.0.0',
        'build_number' => 1,
        'eas_build_id' => $easBuildId,
    ]);
}

/** Compute the signature header EAS would send. */
function easSignature(string $body, string $secret): string
{
    return 'sha1=' . hash_hmac('sha1', $body, $secret);
}

it('returns 503 when the webhook secret is not configured', function (): void {
    config(['eas.webhook_secret' => null]);

    $body = json_encode(['id' => 'eas-001', 'status' => 'finished']);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: ['CONTENT_TYPE' => 'application/json', 'HTTP_EXPO_SIGNATURE' => 'sha1=deadbeef'],
        content: $body,
    )->assertStatus(503);
});

it('rejects requests without an expo-signature header (403)', function (): void {
    $body = json_encode(['id' => 'eas-001', 'status' => 'finished']);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: ['CONTENT_TYPE' => 'application/json'],
        content: $body,
    )->assertStatus(403);
});

it('rejects an invalid signature (403)', function (): void {
    $body = json_encode(['id' => 'eas-001', 'status' => 'finished']);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: ['CONTENT_TYPE' => 'application/json', 'HTTP_EXPO_SIGNATURE' => 'sha1=00112233'],
        content: $body,
    )->assertStatus(403);
});

it('accepts a valid signature and 200s', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    $build = makeWebhookBuild('eas-200-ok');
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode(['id' => 'eas-200-ok', 'status' => 'in-progress']);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertOk()->assertJson(['ok' => true]);

    expect($build->fresh()->status)->toBe(BuildStatus::InProgress->value);
});

it('updates the TenantAppBuild status from the payload', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    $build = makeWebhookBuild('eas-update-status');
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode([
        'id' => 'eas-update-status',
        'status' => 'finished',
        'artifacts' => ['buildUrl' => 'https://expo.dev/artifact.ipa'],
        'logsUrl' => 'https://expo.dev/build-logs',
    ]);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertOk();

    $refreshed = $build->fresh();
    expect($refreshed->status)->toBe(BuildStatus::Finished->value);
    expect($refreshed->artifact_url)->toBe('https://expo.dev/artifact.ipa');
    expect($refreshed->log_url)->toBe('https://expo.dev/build-logs');
});

it('sets finished_at when status transitions to a terminal state', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    $cases = ['finished', 'failed', 'errored', 'canceled'];
    foreach ($cases as $status) {
        $build = makeWebhookBuild('eas-' . $status);
        $secret = (string) config('eas.webhook_secret');
        $body = json_encode(['id' => 'eas-' . $status, 'status' => $status]);

        $this->call(
            method: 'POST',
            uri: '/api/v1/webhooks/eas-build',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
            ],
            content: $body,
        )->assertOk();

        expect($build->fresh()->finished_at)->not->toBeNull();
    }
});

it('dispatches SubmitToStoreJob when status === finished', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    $build = makeWebhookBuild('eas-finished');
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode([
        'id' => 'eas-finished',
        'status' => 'finished',
        'artifacts' => ['buildUrl' => 'https://expo.dev/artifact.ipa'],
    ]);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertOk();

    Bus::assertDispatched(SubmitToStoreJob::class, function (SubmitToStoreJob $job) use ($build): bool {
        return $job->buildId === $build->id;
    });
});

it('does NOT dispatch SubmitToStoreJob on failed builds', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    $build = makeWebhookBuild('eas-failed');
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode([
        'id' => 'eas-failed',
        'status' => 'failed',
        'error' => ['message' => 'Build failed: missing icon'],
    ]);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertOk();

    Bus::assertNotDispatched(SubmitToStoreJob::class);

    expect($build->fresh()->error_message)->toContain('missing icon');
});

it('does NOT dispatch SubmitToStoreJob on errored / canceled builds', function (): void {
    Bus::fake([SubmitToStoreJob::class]);

    foreach (['errored', 'canceled'] as $status) {
        makeWebhookBuild('eas-nodispatch-' . $status);
        $secret = (string) config('eas.webhook_secret');
        $body = json_encode(['id' => 'eas-nodispatch-' . $status, 'status' => $status]);

        $this->call(
            method: 'POST',
            uri: '/api/v1/webhooks/eas-build',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
            ],
            content: $body,
        )->assertOk();
    }

    Bus::assertNotDispatched(SubmitToStoreJob::class);
});

it('returns 404 when the eas_build_id is unknown', function (): void {
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode(['id' => 'eas-not-in-db', 'status' => 'finished']);

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertStatus(404);
});

it('returns 422 when the payload is missing the build id', function (): void {
    $secret = (string) config('eas.webhook_secret');
    $body = json_encode(['status' => 'finished']); // no `id`

    $this->call(
        method: 'POST',
        uri: '/api/v1/webhooks/eas-build',
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
        ],
        content: $body,
    )->assertStatus(422);
});

it('rate-limits webhook requests (120/min)', function (): void {
    $secret = (string) config('eas.webhook_secret');

    $hit429 = false;
    for ($i = 0; $i < 130; $i++) {
        $body = json_encode(['id' => 'eas-rl-' . $i, 'status' => 'finished']);
        $response = $this->call(
            method: 'POST',
            uri: '/api/v1/webhooks/eas-build',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_EXPO_SIGNATURE' => easSignature($body, $secret),
            ],
            content: $body,
        );

        if ($response->status() === 429) {
            $hit429 = true;
            break;
        }
    }

    expect($hit429)->toBeTrue();

    // Defensive: clear the in-memory cache so a subsequent test that
    // re-uses /api/v1/webhooks/eas-build doesn't inherit a saturated bucket.
    \Illuminate\Support\Facades\Cache::flush();
});
