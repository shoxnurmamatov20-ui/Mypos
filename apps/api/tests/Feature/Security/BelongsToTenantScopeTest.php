<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| A2 — BelongsToTenant fail-safe scope + demo seeder hardening
|--------------------------------------------------------------------------
|
| Spec covered:
|   - When no tenant context is resolvable (no Auth user, no `currentTenant`
|     binding), the global scope short-circuits queries to zero rows via
|     `whereRaw('1=0')`. This protects accidental cross-tenant leaks from
|     queued jobs, webhook handlers, and pre-auth middleware.
|   - `Model::withoutGlobalScope('tenant')` opts out of the scope entirely.
|   - `BelongsToTenant::allowEmptyTenantContext()` is a per-request flag that
|     restores the previous lenient behavior — used by demo seeders / super
|     admin tooling that explicitly iterate tenants.
|   - Demo seeders refuse to run outside `local`/`testing` environments —
|     a misconfigured production seed should not be able to insert demo
|     credentials with predictable passwords.
|
| Invariants:
|   - With Auth tenant user logged in     ⇒ scope filters to that tenant_id.
|   - With no Auth and lenient flag OFF   ⇒ zero rows (fail-closed).
|   - With no Auth and lenient flag ON    ⇒ no filter (scope is a no-op).
|   - withoutGlobalScope('tenant')        ⇒ no filter regardless of context.
|   - app()->environment('production')    ⇒ DemoTenantSeeder::run() is a no-op.
*/

use App\Domain\Customer\Models\Customer;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Database\Seeders\DemoTenantSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Support\Facades\Auth;

beforeEach(function (): void {
    // Make sure no test bleed-through leaves the lenient flag set.
    if (app()->bound('tenant.scope.lenient')) {
        app()->forgetInstance('tenant.scope.lenient');
    }
    Auth::logout();
});

afterEach(function (): void {
    if (app()->bound('tenant.scope.lenient')) {
        app()->forgetInstance('tenant.scope.lenient');
    }
});

it('returns no results when no tenant context', function (): void {
    // Seed a row through the Tenant context using lenient mode...
    BelongsToTenant::allowEmptyTenantContext(true);
    $tenant = Tenant::factory()->create();
    Customer::factory()->create(['tenant_id' => $tenant->id]);
    BelongsToTenant::allowEmptyTenantContext(false);
    Auth::logout();

    // No auth + lenient OFF => fail-closed.
    expect(Customer::query()->count())->toBe(0);
    expect(Customer::query()->get()->all())->toBe([]);
});

it('respects withoutGlobalScope opt-out', function (): void {
    BelongsToTenant::allowEmptyTenantContext(true);
    $tenant = Tenant::factory()->create();
    Customer::factory()->count(3)->create(['tenant_id' => $tenant->id]);
    BelongsToTenant::allowEmptyTenantContext(false);
    Auth::logout();

    // Even without Auth + with lenient OFF, withoutGlobalScope bypasses the trait.
    $count = Customer::query()->withoutGlobalScope('tenant')->count();
    expect($count)->toBe(3);
});

it('respects allowEmptyTenantContext explicit opt-in', function (): void {
    BelongsToTenant::allowEmptyTenantContext(true);
    $tenant = Tenant::factory()->create();
    Customer::factory()->count(2)->create(['tenant_id' => $tenant->id]);
    // Keep the flag on for this entire query; do NOT log in a user.

    expect(Customer::query()->count())->toBe(2);
});

it('filters to current tenant when Auth user has tenant_id', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    BelongsToTenant::allowEmptyTenantContext(true);
    $aliceA = Customer::factory()->create(['tenant_id' => $tenantA->id, 'first_name' => 'Alice']);
    Customer::factory()->create(['tenant_id' => $tenantB->id, 'first_name' => 'Bob']);
    BelongsToTenant::allowEmptyTenantContext(false);

    $userA = User::factory()->create(['tenant_id' => $tenantA->id]);
    Auth::login($userA);

    $rows = Customer::query()->get();
    expect($rows->count())->toBe(1);
    expect($rows->first()->id)->toBe($aliceA->id);
    expect($rows->pluck('first_name')->all())->toBe(['Alice']);
});

it('does not filter for super_admin (relies on explicit filters)', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    BelongsToTenant::allowEmptyTenantContext(true);
    Customer::factory()->create(['tenant_id' => $tenantA->id]);
    Customer::factory()->create(['tenant_id' => $tenantB->id]);

    $admin = User::factory()->create(['tenant_id' => null, 'is_super_admin' => true]);
    Auth::login($admin);

    // Super admin's resolveCurrentTenantId() returns null (sees all tenants).
    // The scope therefore needs the lenient flag — super-admin tooling is
    // expected to opt in via BelongsToTenant::allowEmptyTenantContext(true)
    // and apply explicit tenant filters at the call site.
    expect(Customer::query()->count())->toBe(2);
});

it('honors currentTenant container binding for public/kiosk routes', function (): void {
    $tenant = Tenant::factory()->create();

    BelongsToTenant::allowEmptyTenantContext(true);
    Customer::factory()->count(2)->create(['tenant_id' => $tenant->id]);
    BelongsToTenant::allowEmptyTenantContext(false);

    // No Auth user, but kiosk middleware would bind the tenant directly.
    app()->instance('currentTenant', $tenant);

    expect(Customer::query()->count())->toBe(2);

    app()->forgetInstance('currentTenant');
});

it('also applies fail-closed scope to MenuItem and Order', function (): void {
    BelongsToTenant::allowEmptyTenantContext(true);
    $tenant = Tenant::factory()->create();
    $cat = MenuCategory::factory()->create(['tenant_id' => $tenant->id]);
    MenuItem::factory()->create(['tenant_id' => $tenant->id, 'category_id' => $cat->id]);
    Order::factory()->create(['tenant_id' => $tenant->id]);
    BelongsToTenant::allowEmptyTenantContext(false);
    Auth::logout();

    expect(MenuItem::query()->count())->toBe(0);
    expect(Order::query()->count())->toBe(0);
    expect(MenuCategory::query()->count())->toBe(0);
});

it('demo seeder refuses to run in production', function (): void {
    // Swap APP_ENV to production at runtime — Laravel's app->environment()
    // reads from the `env` container binding which we can flip directly.
    $originalEnv = app()->environment();
    app()['env'] = 'production';

    $beforeTenants = Tenant::query()->count();
    $beforeUsers = User::query()->count();

    // This MUST be a no-op — must not create the demo tenant or owner user.
    (new DemoTenantSeeder())->run();

    expect(Tenant::query()->count())->toBe($beforeTenants);
    expect(User::query()->where('email', 'owner@demo.mypos.uz')->exists())->toBeFalse();
    expect(User::query()->count())->toBe($beforeUsers);

    // Restore env so subsequent tests aren't poisoned.
    app()['env'] = $originalEnv;
});

it('demo seeders are no-ops in staging environment too', function (): void {
    $originalEnv = app()->environment();
    app()['env'] = 'staging';

    $before = Tenant::query()->count();
    (new DemoTenantSeeder())->run();
    expect(Tenant::query()->count())->toBe($before);

    app()['env'] = $originalEnv;
});

it('demo seeder runs successfully in testing environment', function (): void {
    expect(app()->environment('testing'))->toBeTrue();

    // DemoTenantSeeder assigns the `owner` role; spatie/laravel-permission
    // requires the role to exist first. RolesSeeder is the canonical source.
    (new RolesSeeder())->run();
    (new DemoTenantSeeder())->run();

    expect(Tenant::query()->where('slug', 'demo-restaurant')->exists())->toBeTrue();
    expect(User::query()->where('email', 'owner@demo.mypos.uz')->exists())->toBeTrue();
});

it('lenient flag does not leak across requests when forgotten', function (): void {
    // After every request the framework rebuilds the container. We simulate
    // the "next request" by forgetting the binding and asserting the scope
    // is fail-closed again.
    BelongsToTenant::allowEmptyTenantContext(true);
    $tenant = Tenant::factory()->create();
    Customer::factory()->create(['tenant_id' => $tenant->id]);
    expect(Customer::query()->count())->toBe(1);

    // Simulate request boundary — clear the binding.
    app()->forgetInstance('tenant.scope.lenient');
    Auth::logout();

    // Without the flag, fail-closed kicks in.
    expect(Customer::query()->count())->toBe(0);
});

it('creating a model auto-fills tenant_id from auth context', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    Auth::login($user);

    BelongsToTenant::allowEmptyTenantContext(false);

    // No tenant_id passed — the trait must back-fill it.
    $customer = new Customer([
        'phone' => '+998901234567',
        'first_name' => 'Auto',
        'locale' => 'uz',
    ]);
    $customer->save();

    expect($customer->fresh()->tenant_id)->toBe($tenant->id);
});
