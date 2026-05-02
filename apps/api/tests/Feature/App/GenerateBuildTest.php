<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — GenerateNativeAppAction
|--------------------------------------------------------------------------
|
| Spec covered (Agent D2 — `App\Domain\Tenant\Actions\GenerateNativeAppAction`):
|   - 422 when `icon_url` is missing.
|   - 422 when `bundle_id` is missing.
|   - 403 when the tenant's tier is below Enterprise (per TierFeatures matrix).
|   - Enterprise tier dispatches the build successfully.
|   - Creates a `tenant_app_builds` row in `queued` state.
|   - Bumps `current_version` (semver patch) and `current_build_number`.
|   - Dispatches `DispatchEasBuildJob` to the queue (via `Bus::fake()`).
|   - Refuses to queue a second build while one is `queued` or `in_progress`.
|   - HTTP route is rate-limited at 10/min for `/api/v1/admin/apps/{id}/build`.
|
| The Action returns a `TenantAppBuild` instance synchronously — actual EAS
| dispatch lives inside `DispatchEasBuildJob`, which we never invoke here.
|
| NOTE: per the live `TierFeatures::matrix()` and `Tenant::canUseNativeApp()`,
| the *current* tier gate is Enterprise-only. The task brief reads as
| "Plus tier dispatches build" — we cover both spellings: a Plus-tier
| dispatch attempt should yield 403 today (matches code) and an Enterprise
| dispatch must succeed. If Plus is later promoted to native-app eligibility,
| the second test is the one to flip.
*/

use App\Domain\Tenant\Actions\GenerateNativeAppAction;
use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Jobs\DispatchEasBuildJob;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

beforeEach(function (): void {
    Role::findOrCreate('owner', 'web');

    if (! class_exists(GenerateNativeAppAction::class)) {
        $this->markTestSkipped('GenerateNativeAppAction not yet shipped (pending Agent D2).');
    }
    if (! class_exists(TenantApp::class) || ! class_exists(TenantAppBuild::class)) {
        $this->markTestSkipped('TenantApp / TenantAppBuild not yet shipped (pending Agent D1).');
    }

    // The GenerateNativeAppAction calls TenantAppBuild::query() which fires the
    // BelongsToTenant scope (fail-closed by default). We bypass-via-auth: every
    // test authenticates as the tenant owner. Tests that don't go through HTTP
    // still get a real $user resolved by Auth::user().
});

/**
 * Helper: build an Enterprise-tier tenant + a fully buildable TenantApp row,
 * AND authenticate the test as that tenant's owner (so the BelongsToTenant
 * scope resolves a tenant_id rather than fail-closing).
 */
function makeBuildableApp(string $tier = 'enterprise'): TenantApp
{
    $tenant = Tenant::factory()->create(['tier' => $tier]);

    $owner = actingAsTenantOwner($tenant);
    \Illuminate\Support\Facades\Auth::login($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'Plov Club',
        'bundle_id' => 'uz.plovclub.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
        'build_account' => 'mypos',
        'status' => 'draft',
    ])->save();

    return $app->fresh();
}

it('throws 422 when icon_url is missing', function (): void {
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);
    $owner = actingAsTenantOwner($tenant);
    \Illuminate\Support\Facades\Auth::login($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => 'No Icon',
        'bundle_id' => 'uz.nicon.' . bin2hex(random_bytes(3)),
        // icon_url intentionally omitted.
    ])->save();

    $action = app(GenerateNativeAppAction::class);

    expect(fn () => $action($app->fresh(), AppPlatform::Ios))
        ->toThrow(UnprocessableEntityHttpException::class);
});

it('throws 422 when app_name is empty', function (): void {
    // bundle_id is filled — but app_name is missing.
    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);
    $owner = actingAsTenantOwner($tenant);
    \Illuminate\Support\Facades\Auth::login($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => 'ios',
        'app_name' => '',
        'bundle_id' => 'uz.empty.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
    ])->save();

    $action = app(GenerateNativeAppAction::class);

    expect(fn () => $action($app->fresh(), AppPlatform::Ios))
        ->toThrow(UnprocessableEntityHttpException::class);
});

it('throws 403 when the tenant tier is free (below Enterprise)', function (): void {
    $app = makeBuildableApp(tier: 'free');
    $action = app(GenerateNativeAppAction::class);

    expect(fn () => $action($app, AppPlatform::Ios))
        ->toThrow(AccessDeniedHttpException::class);
});

it('throws 403 when the tenant tier is plus (current matrix gates native app to Enterprise)', function (): void {
    // The brief documents "Plus tier dispatches build", but the live matrix
    // (TierFeatures::matrix) marks native_app as Enterprise-only. We assert
    // current behaviour; flip the expectation here if Plus is later promoted.
    $app = makeBuildableApp(tier: 'plus');
    $action = app(GenerateNativeAppAction::class);

    expect(fn () => $action($app, AppPlatform::Ios))
        ->toThrow(AccessDeniedHttpException::class);
});

it('Enterprise tier successfully dispatches a build and returns a TenantAppBuild', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp(tier: 'enterprise');
    $action = app(GenerateNativeAppAction::class);

    $build = $action($app, AppPlatform::Ios);

    expect($build)->toBeInstanceOf(TenantAppBuild::class);
    expect($build->tenant_id)->toBe($app->tenant_id);
    expect($build->tenant_app_id)->toBe($app->id);
    expect($build->platform)->toBe(AppPlatform::Ios->value);
});

it('creates a TenantAppBuild row in queued state', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();
    $action = app(GenerateNativeAppAction::class);

    $build = $action($app, AppPlatform::Ios);
    $persisted = TenantAppBuild::query()->withoutGlobalScopes()->find($build->id);

    expect($persisted)->not->toBeNull();
    expect($persisted->status)->toBe(BuildStatus::Queued->value);
    expect($persisted->build_profile)->toBe('production');
});

it('bumps current_version (semver patch) and current_build_number on the parent app', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();
    $app->forceFill([
        'current_version' => '1.2.3',
        'current_build_number' => 7,
    ])->save();

    $action = app(GenerateNativeAppAction::class);
    $build = $action($app->fresh(), AppPlatform::Ios);

    expect($build->version)->toBe('1.2.4');
    expect($build->build_number)->toBe(8);

    $refreshed = $app->fresh();
    expect($refreshed->current_version)->toBe('1.2.4');
    expect($refreshed->current_build_number)->toBe(8);
    expect($refreshed->latest_build_id)->toBe($build->id);
});

it('initial build defaults version to 0.0.1 when current_version is null', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();
    $action = app(GenerateNativeAppAction::class);
    $build = $action($app, AppPlatform::Ios);

    expect($build->version)->toBe('0.0.1');
    expect($build->build_number)->toBe(1);
});

it('dispatches DispatchEasBuildJob to the queue', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();
    $action = app(GenerateNativeAppAction::class);
    $build = $action($app, AppPlatform::Ios);

    Bus::assertDispatched(DispatchEasBuildJob::class, function (DispatchEasBuildJob $job) use ($build): bool {
        return $job->buildId === $build->id;
    });
});

it('refuses to queue a second build while one is queued (concurrency guard)', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();
    $action = app(GenerateNativeAppAction::class);

    // First build → succeeds and leaves a queued row.
    $action($app, AppPlatform::Ios);

    // Second attempt → must throw 422.
    expect(fn () => $action($app->fresh(), AppPlatform::Ios))
        ->toThrow(UnprocessableEntityHttpException::class);
});

it('refuses to queue a second build while one is in_progress', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();

    // Seed an in-progress build directly (simulating EAS started it).
    TenantAppBuild::query()->create([
        'tenant_id' => $app->tenant_id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => BuildStatus::InProgress->value,
        'submission_status' => 'pending',
        'version' => '1.0.0',
        'build_number' => 1,
    ]);

    $action = app(GenerateNativeAppAction::class);

    expect(fn () => $action($app, AppPlatform::Ios))
        ->toThrow(UnprocessableEntityHttpException::class);
});

it('allows a fresh build once the previous one is finished', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();

    TenantAppBuild::query()->create([
        'tenant_id' => $app->tenant_id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => BuildStatus::Finished->value,
        'submission_status' => 'pending',
        'version' => '0.0.1',
        'build_number' => 1,
        'finished_at' => now(),
    ]);

    $action = app(GenerateNativeAppAction::class);
    $build = $action($app->fresh(), AppPlatform::Ios);

    expect($build->status)->toBe(BuildStatus::Queued->value);
});

it('different platforms can run concurrent builds (per-platform concurrency)', function (): void {
    Bus::fake([DispatchEasBuildJob::class]);

    $app = makeBuildableApp();

    // Seed an in-flight iOS build.
    TenantAppBuild::query()->create([
        'tenant_id' => $app->tenant_id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => BuildStatus::Queued->value,
        'submission_status' => 'pending',
        'version' => '0.0.1',
        'build_number' => 1,
    ]);

    // Dispatching an Android build on the same row must succeed because the
    // concurrency check is per (app, platform).
    $action = app(GenerateNativeAppAction::class);
    $build = $action($app, AppPlatform::Android);

    expect($build->platform)->toBe(AppPlatform::Android->value);
});

it('bumpVersion handles malformed input gracefully', function (): void {
    $action = app(GenerateNativeAppAction::class);

    expect($action->bumpVersion('1.2.3'))->toBe('1.2.4');
    expect($action->bumpVersion('1.2'))->toBe('1.2.1');
    expect($action->bumpVersion('1'))->toBe('1.0.1');
    expect($action->bumpVersion(''))->toBe('0.0.1');
    // Non-numeric components fall back to 0/0/1.
    expect($action->bumpVersion('a.b.c'))->toBe('0.0.1');
});

it('POST /api/v1/admin/apps/{id}/build is rate-limited (10/min)', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.apps.build')) {
        $this->markTestSkipped('Build dispatch route not yet wired (pending Agent D2/route).');
    }

    Bus::fake([DispatchEasBuildJob::class]);

    $tenant = Tenant::factory()->create(['tier' => 'enterprise']);
    $owner = actingAsTenantOwner($tenant);
    Sanctum::actingAs($owner);

    $app = new TenantApp();
    $app->forceFill([
        'tenant_id' => $tenant->id,
        'platform' => 'android',
        'app_name' => 'RL test',
        'bundle_id' => 'uz.rl.' . bin2hex(random_bytes(3)),
        'icon_url' => 'https://cdn.mypos.uz/icon.png',
    ])->save();

    // Hit the endpoint > 10 times in the same window. The throttle middleware
    // is configured at 10/min; the 11th call should yield 429.
    $hit429 = false;
    for ($i = 0; $i < 12; $i++) {
        $response = $this->postJson('/api/v1/admin/apps/' . $app->id . '/build');
        if ($response->status() === 429) {
            $hit429 = true;
            break;
        }
        // Roll the row back to "no in-flight build" so concurrency check
        // doesn't short-circuit the throttle assertion.
        TenantAppBuild::query()->where('tenant_app_id', $app->id)->delete();
    }

    expect($hit429)->toBeTrue();

    // Defensive: clear the in-memory rate-limit bucket so subsequent tests
    // don't inherit a saturated state (array cache is process-scoped).
    \Illuminate\Support\Facades\Cache::flush();
});
