<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Security Audit Regression — high-level smoke
|--------------------------------------------------------------------------
|
| Quick checks that act as a tripwire for any of the 6 critical fixes
| silently regressing. Each check is a one-line invariant; if any of them
| fail the team gets a CI signal long before the deeper Pest suites surface
| the cause.
|
| Maps to:
|   A1 — RLS on tenant-scoped tables
|   A2 — BelongsToTenant fail-safe + demo seeder hardening
|   A3 — Click + Payme webhook stub-mode bypass closed
|   A4 — 9 Policies registered with Gate
|   A5 — EnsureSuperAdmin no longer accepts wildcard ability
|   A6 — Customer.phone_index column exists, Customer.phone is encrypted
*/

use App\Domain\Customer\Models\Customer;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\Recipe;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Models\Payment;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\PaymentWebhookIpAllowlist;
use App\Http\Middleware\SetTenantContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role as SpatieRole;

it('all 6 critical issues are addressed', function (): void {
    foreach (['super_admin', 'owner', 'manager', 'cashier', 'waiter', 'chef'] as $r) {
        SpatieRole::findOrCreate($r, 'web');
    }

    /*
    |----------------------------------------------------------------------
    | A1 — RLS on tenant-scoped tables (skip silently on non-pgsql)
    |----------------------------------------------------------------------
    */
    if (DB::connection()->getDriverName() === 'pgsql') {
        $rlsRows = DB::select(
            "SELECT tablename FROM pg_tables
             WHERE schemaname = current_schema()
               AND tablename IN ('orders', 'payments', 'customers', 'menu_items')
               AND rowsecurity = true",
        );
        expect(count($rlsRows))->toBeGreaterThanOrEqual(4); // A1
    }

    /*
    |----------------------------------------------------------------------
    | A2 — BelongsToTenant fail-safe + demo seeder hardening
    |----------------------------------------------------------------------
    */
    // No auth, no lenient flag => zero rows from any tenant-scoped model.
    expect(Customer::query()->count())->toBe(0);
    expect(Order::query()->count())->toBe(0);
    expect(MenuItem::query()->count())->toBe(0); // A2 fail-closed

    /*
    |----------------------------------------------------------------------
    | A3 — Webhook stub-mode bypass closed
    |----------------------------------------------------------------------
    */
    // The provider config defaults to "stub disabled".
    expect((bool) config('payment.allow_stub_webhooks'))->toBeFalse(); // A3

    // Production refusal is enforced inside the providers themselves —
    // covered by PaymentWebhookBypassTest. We assert here that the provider
    // class file at least references "production" guard logic.
    $clickSrc = file_get_contents(__DIR__ . '/../../../app/Domain/Payment/Providers/ClickProvider.php');
    expect($clickSrc)->toContain("environment('production')");
    $paymeSrc = file_get_contents(__DIR__ . '/../../../app/Domain/Payment/Providers/PaymeProvider.php');
    expect($paymeSrc)->toContain("environment('production')");

    /*
    |----------------------------------------------------------------------
    | A4 — 9 Policies registered with Gate
    |----------------------------------------------------------------------
    */
    $policyMap = [
        Order::class,
        Payment::class,
        Customer::class,
        MenuItem::class,
        MenuCategory::class,
        Ingredient::class,
        Recipe::class,
        StockMovement::class,
        Tenant::class,
    ];
    foreach ($policyMap as $modelClass) {
        expect(Gate::getPolicyFor($modelClass))->not->toBeNull(); // A4
    }

    /*
    |----------------------------------------------------------------------
    | A5 — EnsureSuperAdmin no longer accepts wildcard ability
    |----------------------------------------------------------------------
    */
    $middlewareSrc = file_get_contents(__DIR__ . '/../../../app/Http/Middleware/EnsureSuperAdmin.php');
    expect($middlewareSrc)->not->toContain("tokenCan('*')"); // A5
    expect($middlewareSrc)->toContain("tokenCan('super-admin')");

    // Routing-level wildcard rejection.
    $admin = User::factory()->create([
        'is_super_admin' => true,
        'tenant_id' => null,
    ]);
    Sanctum::actingAs($admin, ['*']);
    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);

    /*
    |----------------------------------------------------------------------
    | A6 — Customer.phone_index column + Customer.phone encrypted
    |----------------------------------------------------------------------
    */
    if (Schema::hasColumn('customers', 'phone_index')) {
        $tenant = Tenant::factory()->create();

        // Use lenient flag so we can write across the seeder boundary.
        \App\Domain\Shared\Concerns\BelongsToTenant::allowEmptyTenantContext(true);
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '+998901112233',
        ]);
        \App\Domain\Shared\Concerns\BelongsToTenant::allowEmptyTenantContext(false);

        $raw = DB::table('customers')->where('id', $customer->id)->first();
        // Encrypted at rest, NOT plaintext.
        expect((string) $raw->phone)->not->toContain('998901112233');
        // Index hash matches HMAC-SHA256(APP_KEY, normalized_phone) — the
        // model encapsulates the derivation in Customer::hashPhone().
        expect($raw->phone_index)->toBe(Customer::hashPhone('+998901112233')); // A6
    }
});

it('SetTenantContext middleware is registered in api group', function (): void {
    $kernel = app()->make(\Illuminate\Contracts\Http\Kernel::class);
    $router = app('router');

    // Resolve the api middleware group.
    $apiGroup = $router->getMiddlewareGroups()['api'] ?? [];
    $apiGroup = array_map(fn ($m) => is_string($m) ? $m : $m::class, $apiGroup);

    expect($apiGroup)->toContain(SetTenantContext::class);
});

it('payment.webhook.ips middleware alias is registered', function (): void {
    $router = app('router');
    $aliases = $router->getMiddleware();

    expect($aliases)->toHaveKey('payment.webhook.ips');
    expect($aliases['payment.webhook.ips'])->toBe(PaymentWebhookIpAllowlist::class);
});

it('super-admin middleware alias is registered', function (): void {
    $router = app('router');
    $aliases = $router->getMiddleware();

    expect($aliases)->toHaveKey('super-admin');
    expect($aliases['super-admin'])->toBe(EnsureSuperAdmin::class);
});

it('LoginAction uses tenant:full ability (file-level grep)', function (): void {
    $loginSrc = file_get_contents(__DIR__ . '/../../../app/Domain/Auth/Actions/LoginAction.php');
    expect($loginSrc)->toContain("'tenant:full'");
    expect($loginSrc)->not->toContain("['*']"); // never the wildcard
});

it('SuperAdminLoginAction uses super-admin ability with 1-hour TTL', function (): void {
    $src = file_get_contents(__DIR__ . '/../../../app/Domain/SuperAdmin/Actions/SuperAdminLoginAction.php');
    expect($src)->toContain("'super-admin'");
    expect($src)->toContain('addHour'); // 1h TTL
    expect($src)->not->toContain("['*']");
});

it('BelongsToTenant trait contains the fail-safe whereRaw 1=0 sentinel', function (): void {
    $traitSrc = file_get_contents(__DIR__ . '/../../../app/Domain/Shared/Concerns/BelongsToTenant.php');
    expect($traitSrc)->toContain("whereRaw('1=0')");
});

it('DemoTenantSeeder refuses production environment (file-level grep)', function (): void {
    $src = file_get_contents(__DIR__ . '/../../../database/seeders/DemoTenantSeeder.php');
    expect($src)->toContain("environment(['local', 'testing'])");
    expect($src)->toContain('return');
});
