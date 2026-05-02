<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — SubmitToStoreJob
|--------------------------------------------------------------------------
|
| Spec covered (Agent D3 — `App\Jobs\SubmitToStoreJob`):
|
|   - iOS builds invoke `AppStoreConnectClient::submitForReview()`.
|   - Android builds invoke `GooglePlayClient::uploadAab()`.
|   - When `tenant_apps.build_account === 'tenant'`, the job marks the build as
|     awaiting owner action instead of auto-submitting.
|   - On successful submit: `submission_status` flips to `submitted`,
|     `submitted_at` is timestamped, `reviewer_notes` is cleared.
|   - On exception thrown by the API client: `reviewer_notes` captures the
|     error and the job re-throws (queue retries up to $tries=3).
|   - Skips when build status is anything other than `finished`.
|   - Skips when `submission_status` is already non-pending (idempotency).
|
| The two upstream API clients are framework-only stubs today; we mock them
| via the container so we can assert call shape without involving Apple/Google.
*/

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Enums\SubmissionStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\AppStoreConnectClient;
use App\Domain\Tenant\Services\GooglePlayClient;
use App\Jobs\SubmitToStoreJob;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');

    if (! class_exists(SubmitToStoreJob::class)) {
        $this->markTestSkipped('SubmitToStoreJob not yet shipped (pending Agent D3).');
    }
    if (! class_exists(AppStoreConnectClient::class) || ! class_exists(GooglePlayClient::class)) {
        $this->markTestSkipped('Store API clients not yet shipped (pending Agent D3).');
    }
});

/**
 * Build a (tenant, app, build) triple ready to be submitted. `$status` lets
 * tests poke an in-progress / failed build to verify the early-exit guards.
 *
 * Authenticates the test as the tenant's owner so the BelongsToTenant scope
 * has a tenant_id to match against when we later call `$build->fresh()`.
 */
function makeSubmittableBuild(
    string $platform = 'ios',
    string $buildAccount = 'mypos',
    string $status = BuildStatus::Finished->value,
    string $submissionStatus = SubmissionStatus::Pending->value,
): TenantAppBuild {
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);

    $owner = actingAsTenantOwner($tenant);
    \Illuminate\Support\Facades\Auth::login($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => $platform,
        'app_name' => 'Submit Test',
        'bundle_id' => 'uz.submit.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
        'apple_app_id' => 1234567890,
        'google_package_name' => 'uz.submit.' . bin2hex(random_bytes(3)),
        'build_account' => $buildAccount,
    ])->save();

    return TenantAppBuild::query()->create([
        'tenant_id' => $tenant->id,
        'tenant_app_id' => $app->id,
        'platform' => $platform,
        'status' => $status,
        'submission_status' => $submissionStatus,
        'version' => '1.0.0',
        'build_number' => 1,
        'eas_build_id' => 'eas-' . bin2hex(random_bytes(4)),
        'artifact_url' => 'https://expo.dev/artifact.ipa',
    ]);
}

it('iOS build invokes AppStoreConnectClient::submitForReview', function (): void {
    $build = makeSubmittableBuild(platform: 'ios');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldReceive('submitForReview')
        ->once()
        ->andReturn(['status' => 'submitted', 'submission_id' => 'sub-1', 'raw' => []]);
    $this->app->instance(AppStoreConnectClient::class, $apple);

    // Bind a no-op Google client so DI resolution succeeds even though we
    // shouldn't be hitting it.
    $google = Mockery::mock(GooglePlayClient::class);
    $google->shouldNotReceive('uploadAab');
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    $refreshed = $build->fresh();
    expect($refreshed->submission_status)->toBe(SubmissionStatus::Submitted->value);
    expect($refreshed->submitted_at)->not->toBeNull();
});

it('Android build invokes GooglePlayClient::uploadAab', function (): void {
    $build = makeSubmittableBuild(platform: 'android');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldNotReceive('submitForReview');
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $google->shouldReceive('uploadAab')->once()->andReturn('stub-version-code');
    $google->shouldReceive('internalTestingOptInUrl')->andReturn('https://play.google.com/apps/internaltest?id=test');
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    $refreshed = $build->fresh();
    expect($refreshed->submission_status)->toBe(SubmissionStatus::Submitted->value);
    expect($refreshed->qr_code_url)->toContain('play.google.com');
});

it('build_account=tenant flow marks pending_owner instead of auto-submitting', function (): void {
    $build = makeSubmittableBuild(platform: 'ios', buildAccount: 'tenant');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldNotReceive('submitForReview');
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $google->shouldNotReceive('uploadAab');
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    $refreshed = $build->fresh();
    // Reuses Pending — the disambiguation lives in `reviewer_notes`.
    expect($refreshed->submission_status)->toBe(SubmissionStatus::Pending->value);
    expect($refreshed->reviewer_notes)->toContain('tenant submission');
});

it('updates submission_status + submitted_at on a successful Apple submit', function (): void {
    $build = makeSubmittableBuild(platform: 'ios');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldReceive('submitForReview')->once()->andReturn([
        'status' => 'submitted',
        'submission_id' => 'sub-99',
        'raw' => [],
    ]);
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    $refreshed = $build->fresh();
    expect($refreshed->submission_status)->toBe(SubmissionStatus::Submitted->value);
    expect($refreshed->submitted_at)->not->toBeNull();
    expect($refreshed->reviewer_notes)->toBeNull();
});

it('captures error_message in reviewer_notes on Apple submission failure', function (): void {
    $build = makeSubmittableBuild(platform: 'ios');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldReceive('submitForReview')
        ->once()
        ->andThrow(new RuntimeException('Apple sandbox unavailable'));
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $this->app->instance(GooglePlayClient::class, $google);

    expect(fn () => (new SubmitToStoreJob($build->id))->handle($apple, $google))
        ->toThrow(RuntimeException::class);

    $refreshed = $build->fresh();
    expect($refreshed->reviewer_notes)->toContain('Apple sandbox unavailable');
    // Submission status remains pending — the queue will retry up to $tries.
    expect($refreshed->submission_status)->toBe(SubmissionStatus::Pending->value);
});

it('captures error_message in reviewer_notes on Google submission failure', function (): void {
    $build = makeSubmittableBuild(platform: 'android');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $google->shouldReceive('uploadAab')
        ->once()
        ->andThrow(new RuntimeException('Play upload quota exceeded'));
    $this->app->instance(GooglePlayClient::class, $google);

    expect(fn () => (new SubmitToStoreJob($build->id))->handle($apple, $google))
        ->toThrow(RuntimeException::class);

    expect($build->fresh()->reviewer_notes)->toContain('quota exceeded');
});

it('skips submission when build status is not finished (idempotency)', function (): void {
    $build = makeSubmittableBuild(
        platform: 'ios',
        status: BuildStatus::InProgress->value,
    );

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldNotReceive('submitForReview');
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    expect($build->fresh()->submission_status)->toBe(SubmissionStatus::Pending->value);
});

it('skips submission when submission_status is already non-pending (idempotency)', function (): void {
    $build = makeSubmittableBuild(
        platform: 'ios',
        status: BuildStatus::Finished->value,
        submissionStatus: SubmissionStatus::Submitted->value,
    );

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldNotReceive('submitForReview');
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    expect($build->fresh()->submission_status)->toBe(SubmissionStatus::Submitted->value);
});

it('handles unsupported platform values with a reviewer_notes record', function (): void {
    $build = makeSubmittableBuild(platform: 'universal');

    $apple = Mockery::mock(AppStoreConnectClient::class);
    $apple->shouldNotReceive('submitForReview');
    $this->app->instance(AppStoreConnectClient::class, $apple);

    $google = Mockery::mock(GooglePlayClient::class);
    $google->shouldNotReceive('uploadAab');
    $this->app->instance(GooglePlayClient::class, $google);

    (new SubmitToStoreJob($build->id))->handle($apple, $google);

    expect($build->fresh()->reviewer_notes)->toContain('Unsupported platform');
});
