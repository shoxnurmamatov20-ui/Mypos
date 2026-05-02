<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — TenantApp + TenantAppBuild policies
|--------------------------------------------------------------------------
|
| Spec covered:
|   - `App\Domain\Tenant\Policies\TenantAppPolicy`
|   - `App\Domain\Tenant\Policies\TenantAppBuildPolicy`
|
| The policies share an identical model:
|   - viewAny / view  → owner OR manager (same tenant).
|   - create / update / delete / build / cancel → owner only.
|   - cross-tenant   → always denied.
|   - cashier / waiter / chef / courier → no access.
|
| Tested via the Gate facade (no HTTP layer) — so the gating logic is verified
| independently of route wiring. This avoids false negatives if the controller
| short-circuits at the middleware before the policy fires.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Policies\TenantAppPolicy;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    foreach (['owner', 'manager', 'cashier', 'waiter', 'chef', 'courier'] as $role) {
        Role::findOrCreate($role, 'web');
    }

    if (! class_exists(TenantAppPolicy::class)) {
        $this->markTestSkipped('TenantAppPolicy not yet shipped (pending Agent D2).');
    }
    if (! class_exists(TenantApp::class) || ! class_exists(TenantAppBuild::class)) {
        $this->markTestSkipped('TenantApp / TenantAppBuild not yet shipped (pending Agent D1).');
    }
});

/** Make a user with the given role belonging to a fresh tenant. */
function userWithRole(string $role, ?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create(['tier' => 'enterprise']);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $user->assignRole($role);

    return $user->fresh();
}

/** Provision an app row inside the same tenant as `$user`. */
function appFor(User $user): TenantApp
{
    return TenantApp::query()->create([
        'tenant_id' => $user->tenant_id,
        'platform' => 'ios',
        'app_name' => 'Policy app',
        'bundle_id' => 'uz.policy.' . bin2hex(random_bytes(3)),
    ]);
}

it('owner has full access (view/create/update/delete/build/cancel)', function (): void {
    $owner = userWithRole('owner');
    $app = appFor($owner);

    expect(Gate::forUser($owner)->allows('viewAny', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($owner)->allows('view', $app))->toBeTrue();
    expect(Gate::forUser($owner)->allows('create', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($owner)->allows('update', $app))->toBeTrue();
    expect(Gate::forUser($owner)->allows('delete', $app))->toBeTrue();
    expect(Gate::forUser($owner)->allows('build', $app))->toBeTrue();
    expect(Gate::forUser($owner)->allows('cancel', $app))->toBeTrue();
});

it('manager has read-only access (view ok, create/update/delete denied)', function (): void {
    $manager = userWithRole('manager');
    $app = appFor($manager);

    expect(Gate::forUser($manager)->allows('viewAny', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($manager)->allows('view', $app))->toBeTrue();

    expect(Gate::forUser($manager)->denies('create', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($manager)->denies('update', $app))->toBeTrue();
    expect(Gate::forUser($manager)->denies('delete', $app))->toBeTrue();
    expect(Gate::forUser($manager)->denies('build', $app))->toBeTrue();
});

it('cashier has no access at all', function (): void {
    $cashier = userWithRole('cashier');
    $app = appFor($cashier);

    expect(Gate::forUser($cashier)->denies('viewAny', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($cashier)->denies('view', $app))->toBeTrue();
    expect(Gate::forUser($cashier)->denies('create', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($cashier)->denies('update', $app))->toBeTrue();
});

it('waiter / chef / courier have no access', function (): void {
    foreach (['waiter', 'chef', 'courier'] as $role) {
        $user = userWithRole($role);
        $app = appFor($user);

        expect(Gate::forUser($user)->denies('viewAny', TenantApp::class))
            ->toBeTrue("role `{$role}` should be denied viewAny");
        expect(Gate::forUser($user)->denies('view', $app))
            ->toBeTrue("role `{$role}` should be denied view");
        expect(Gate::forUser($user)->denies('update', $app))
            ->toBeTrue("role `{$role}` should be denied update");
    }
});

it('cross-tenant access is blocked even for owners of other tenants', function (): void {
    $alice = userWithRole('owner');
    $bob = userWithRole('owner'); // different tenant

    $aliceApp = appFor($alice);

    // Alice's owner sees her own row.
    expect(Gate::forUser($alice)->allows('view', $aliceApp))->toBeTrue();
    // Bob's owner — same role, different tenant — must NOT see it.
    expect(Gate::forUser($bob)->denies('view', $aliceApp))->toBeTrue();
    expect(Gate::forUser($bob)->denies('update', $aliceApp))->toBeTrue();
    expect(Gate::forUser($bob)->denies('delete', $aliceApp))->toBeTrue();
});

it('TenantAppBuildPolicy: owner can view + cancel; manager can view but not cancel', function (): void {
    $owner = userWithRole('owner');
    $manager = userWithRole('manager', Tenant::query()->find($owner->tenant_id));

    $app = appFor($owner);
    $build = TenantAppBuild::query()->create([
        'tenant_id' => $owner->tenant_id,
        'tenant_app_id' => $app->id,
        'platform' => 'ios',
        'status' => 'queued',
        'submission_status' => 'pending',
        'version' => '0.0.1',
        'build_number' => 1,
    ]);

    expect(Gate::forUser($owner)->allows('view', $build))->toBeTrue();
    expect(Gate::forUser($owner)->allows('cancel', $build))->toBeTrue();

    expect(Gate::forUser($manager)->allows('view', $build))->toBeTrue();
    expect(Gate::forUser($manager)->denies('cancel', $build))->toBeTrue();
});

it('a user without a tenant_id is denied at the policy level', function (): void {
    // Mirrors the super-admin path — they live outside the tenant.admin
    // surface entirely; the policy fail-closes for safety.
    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);
    $user->assignRole('owner');

    expect(Gate::forUser($user)->denies('viewAny', TenantApp::class))->toBeTrue();
    expect(Gate::forUser($user)->denies('create', TenantApp::class))->toBeTrue();
});

it('a user with a different tenant_id but matching role is denied (defense-in-depth)', function (): void {
    $tenantA = Tenant::factory()->create(['tier' => 'enterprise']);
    $tenantB = Tenant::factory()->create(['tier' => 'enterprise']);

    $userA = userWithRole('owner', $tenantA);
    $appB = TenantApp::query()->create([
        'tenant_id' => $tenantB->id,
        'platform' => 'ios',
        'app_name' => 'B',
        'bundle_id' => 'uz.b.' . bin2hex(random_bytes(3)),
    ]);

    expect(Gate::forUser($userA)->denies('view', $appB))->toBeTrue();
    expect(Gate::forUser($userA)->denies('update', $appB))->toBeTrue();
    expect(Gate::forUser($userA)->denies('delete', $appB))->toBeTrue();
    expect(Gate::forUser($userA)->denies('build', $appB))->toBeTrue();
});
