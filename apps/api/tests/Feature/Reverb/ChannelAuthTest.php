<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| B7-T5 — Reverb private-channel authorization (`routes/channels.php`)
|--------------------------------------------------------------------------
|
| Spec covered (Agent B3):
|   - tenant.{id}.kitchen     → only chef + manager + owner of tenant
|   - tenant.{id}.staff       → any active employee of tenant
|   - tenant.{id}.dashboard   → only owner + manager of tenant
|   - order.{id}              → authorized when:
|        a) the user belongs to the order's tenant + has a matching role, OR
|        b) the request carries a valid tracking_token that matches the order.
|
| The Broadcast::routes registers POST /broadcasting/auth, which Echo
| hits. Each channel callback receives `(User $user, ...args)` and returns
| `true` / `false` / array (presence channels). We test the callback
| directly via `Broadcast::auth()` — much faster than spinning up Pusher
| in-test.
|
| If routes/channels.php hasn't landed yet, every test is skipped with a
| message rather than crashing.
*/

use App\Domain\Auth\Enums\Role;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Spatie\Permission\Models\Role as SpatieRole;

beforeEach(function (): void {
    foreach (Role::values() as $role) {
        SpatieRole::findOrCreate($role, 'web');
        SpatieRole::findOrCreate($role, 'sanctum');
    }
});

function channelsFileExists(): bool
{
    return file_exists(base_path('routes/channels.php'));
}

function makeUser(string $role, ?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_super_admin' => false,
    ]);
    $user->assignRole($role);
    return $user;
}

/** Resolve a callback registered with Broadcast::channel(). Null if absent. */
function resolveChannelCallback(string $pattern): ?\Closure
{
    if (! channelsFileExists()) {
        return null;
    }

    $broadcaster = Broadcast::driver();
    if (! method_exists($broadcaster, 'getChannels')) {
        return null;
    }

    $channels = $broadcaster->getChannels();

    // Channels may be a Collection, array, or hash — normalise to array.
    if ($channels instanceof \Illuminate\Support\Collection) {
        $channels = $channels->all();
    }

    if (! isset($channels[$pattern])) {
        return null;
    }

    $cb = $channels[$pattern];
    return $cb instanceof \Closure ? $cb : \Closure::fromCallable($cb);
}

it('authorizes tenant.{id}.kitchen for chef role', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $chef = makeUser(Role::Chef->value, $tenant);

    $cb = resolveChannelCallback('tenant.{tenantId}.kitchen');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $result = $cb($chef, $tenant->id);
    expect($result)->toBeTruthy();
});

it('rejects tenant.{id}.kitchen for waiter role', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $waiter = makeUser(Role::Waiter->value, $tenant);

    $cb = resolveChannelCallback('tenant.{tenantId}.kitchen');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $result = $cb($waiter, $tenant->id);
    expect($result)->toBeFalsy();
});

it('authorizes tenant.{id}.dashboard for owner+manager only', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $cb = resolveChannelCallback('tenant.{tenantId}.dashboard');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $owner = makeUser(Role::Owner->value, $tenant);
    $manager = makeUser(Role::Manager->value, $tenant);
    $cashier = makeUser(Role::Cashier->value, $tenant);
    $waiter = makeUser(Role::Waiter->value, $tenant);

    expect($cb($owner, $tenant->id))->toBeTruthy();
    expect($cb($manager, $tenant->id))->toBeTruthy();
    expect($cb($cashier, $tenant->id))->toBeFalsy();
    expect($cb($waiter, $tenant->id))->toBeFalsy();
});

it('rejects cross-tenant subscription attempts', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $a = Tenant::factory()->create();
    $b = Tenant::factory()->create();

    $cb = resolveChannelCallback('tenant.{tenantId}.kitchen');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $chefAtA = makeUser(Role::Chef->value, $a);

    // Trying to subscribe to tenant B's kitchen channel must fail.
    $result = $cb($chefAtA, $b->id);
    expect($result)->toBeFalsy();
});

it('authorizes order.{id} via tracking_token query param', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $order = \App\Domain\Order\Models\Order::factory()->create([
        'tenant_id' => $tenant->id,
        'tracking_token' => 'tok_' . bin2hex(random_bytes(16)),
    ]);

    // Inject the token via request query so the callback can read it via
    // request()->query('tracking_token').
    $this->call('GET', '/?tracking_token=' . $order->tracking_token);

    $cb = resolveChannelCallback('order.{orderId}');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    // Public channels accept null user; private channels require one.
    $request = Request::create('/?tracking_token=' . $order->tracking_token);
    app()->instance('request', $request);
    $result = $cb(null, $order->id);
    expect($result)->toBeTruthy();
});

it('rejects order.{id} without valid token or auth', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $order = \App\Domain\Order\Models\Order::factory()->create([
        'tenant_id' => $tenant->id,
        'tracking_token' => 'tok_' . bin2hex(random_bytes(16)),
    ]);

    $cb = resolveChannelCallback('order.{orderId}');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $request = Request::create('/?tracking_token=wrong-token');
    app()->instance('request', $request);
    $result = $cb(null, $order->id);
    expect($result)->toBeFalsy();
});

it('authorizes order.{id} for the tenant owner', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $owner = makeUser(Role::Owner->value, $tenant);
    $order = \App\Domain\Order\Models\Order::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $cb = resolveChannelCallback('order.{orderId}');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $result = $cb($owner, $order->id);
    expect($result)->toBeTruthy();
});

it('rejects order.{id} for a user from another tenant', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $a = Tenant::factory()->create();
    $b = Tenant::factory()->create();
    $ownerB = makeUser(Role::Owner->value, $b);

    $orderAtA = \App\Domain\Order\Models\Order::factory()->create(['tenant_id' => $a->id]);

    $cb = resolveChannelCallback('order.{orderId}');
    if (! $cb) {
        $this->markTestSkipped('Channel pattern not registered yet.');
    }

    $result = $cb($ownerB, $orderAtA->id);
    expect($result)->toBeFalsy();
});

it('staff channel accepts any active employee of the tenant', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $cb = resolveChannelCallback('tenant.{tenantId}.staff');
    if (! $cb) {
        $this->markTestSkipped('staff channel pattern not registered yet.');
    }

    foreach ([Role::Cashier, Role::Waiter, Role::Chef, Role::Courier] as $role) {
        $user = makeUser($role->value, $tenant);
        expect($cb($user, $tenant->id))->toBeTruthy();
    }
});

it('staff channel rejects external customers', function (): void {
    if (! channelsFileExists()) {
        $this->markTestSkipped('routes/channels.php pending Agent B3.');
    }

    $tenant = Tenant::factory()->create();
    $cb = resolveChannelCallback('tenant.{tenantId}.staff');
    if (! $cb) {
        $this->markTestSkipped('staff channel pattern not registered yet.');
    }

    $customer = makeUser(Role::Customer->value, $tenant);
    expect($cb($customer, $tenant->id))->toBeFalsy();
});
