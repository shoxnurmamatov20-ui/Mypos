<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| A5 — Sanctum token abilities & EnsureSuperAdmin guard hardening
|--------------------------------------------------------------------------
|
| Spec covered:
|   - LoginAction issues `tenant:full` (NEVER `*`). Wildcard '*' must not pass
|     the EnsureSuperAdmin middleware even if `is_super_admin` evaluates true.
|   - SuperAdminLoginAction issues exactly `['super-admin']` with a 1-hour TTL.
|   - LoginAction (tenant) issues `['tenant:full']` with a 7-day TTL.
|   - All tokens for a user are revoked when `is_super_admin` flips
|     (false→true OR true→false) — handled by a User observer / hook on
|     update.
|   - The EnsureSuperAdmin middleware does NOT accept the wildcard ability:
|     `tokenCan('*')` is no longer a fallback.
*/

use App\Domain\Auth\Actions\LoginAction;
use App\Domain\SuperAdmin\Actions\SuperAdminLoginAction;
use App\Domain\SuperAdmin\Enums\AuditActorType;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    RateLimiter::clear('login:127.0.0.1');
    \Spatie\Permission\Models\Role::findOrCreate('super_admin', 'web');
    \Spatie\Permission\Models\Role::findOrCreate('owner', 'web');
});

it('removes wildcard token from super-admin middleware', function (): void {
    // A token with wildcard '*' MUST NOT pass the EnsureSuperAdmin guard,
    // even when is_super_admin is true. That fallback was the historical
    // tenant→super-admin escalation path.
    $admin = User::factory()->create([
        'is_super_admin' => true,
        'tenant_id' => null,
    ]);

    Sanctum::actingAs($admin, ['*']); // Wildcard ONLY — no 'super-admin' ability.

    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);
});

it('explicit super-admin ability passes the middleware', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->getJson('/api/v1/super-admin/me')->assertOk();
});

it('tenant:full ability does not pass super-admin middleware', function (): void {
    $tenantUser = User::factory()->create([
        'is_super_admin' => true, // even with the flag
        'tenant_id' => null,
    ]);

    Sanctum::actingAs($tenantUser, ['tenant:full']);

    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);
});

it('LoginAction issues tenant-scoped abilities (no wildcard)', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'owner@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => false,
    ]);

    $result = (new LoginAction())('owner@mypos.test', 'secret-pass', '127.0.0.1');

    $token = $result['token'];
    $accessToken = PersonalAccessToken::findToken($token);
    expect($accessToken)->not->toBeNull();

    expect($accessToken->abilities)->toBeArray();
    expect($accessToken->abilities)->not->toContain('*');
    expect($accessToken->abilities)->not->toContain('super-admin');
    expect($accessToken->abilities)->toContain('tenant:full');
});

it('LoginAction never mints super-admin ability even if is_super_admin is true', function (): void {
    // Defense in depth: the tenant login flow must NEVER yield a super-admin
    // ability. That privilege escalation has to come exclusively from the
    // dedicated SuperAdminLoginAction.
    $user = User::factory()->create([
        'tenant_id' => null,
        'email' => 'leak@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true, // attacker set this
    ]);

    $result = (new LoginAction())('leak@mypos.test', 'secret-pass', '127.0.0.1');

    $token = PersonalAccessToken::findToken($result['token']);
    expect($token->abilities)->not->toContain('super-admin');
    expect($token->abilities)->not->toContain('*');
});

it('SuperAdminLoginAction issues 1-hour tokens', function (): void {
    $admin = User::factory()->create([
        'email' => 'admin@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true,
        'super_admin_role' => 'admin',
    ]);

    $result = (new SuperAdminLoginAction())('admin@mypos.test', 'secret-pass', '127.0.0.1');

    $token = PersonalAccessToken::findToken($result['token']);
    expect($token)->not->toBeNull();
    expect($token->abilities)->toBe(['super-admin']);
    expect($token->expires_at)->not->toBeNull();

    // Allow some clock skew — assert TTL is between 50 and 70 minutes.
    $minutesUntilExpiry = now()->diffInMinutes($token->expires_at, false);
    expect($minutesUntilExpiry)->toBeGreaterThan(50);
    expect($minutesUntilExpiry)->toBeLessThanOrEqual(60);
});

it('SuperAdminLoginAction issues exactly the super-admin ability — no wildcard', function (): void {
    $admin = User::factory()->create([
        'email' => 'admin@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true,
    ]);

    $result = (new SuperAdminLoginAction())('admin@mypos.test', 'secret-pass', '127.0.0.1');

    $token = PersonalAccessToken::findToken($result['token']);
    expect($token->abilities)->toBe(['super-admin']);
    expect($token->abilities)->not->toContain('*');
});

it('default tenant token TTL is 7 days', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'ttl@mypos.test',
        'password' => Hash::make('secret-pass'),
    ]);

    $result = (new LoginAction())('ttl@mypos.test', 'secret-pass', '127.0.0.1');

    $token = PersonalAccessToken::findToken($result['token']);
    expect($token->expires_at)->not->toBeNull();

    // TTL between 6 days 23h and 7 days 1h.
    $hoursUntilExpiry = now()->diffInHours($token->expires_at, false);
    expect($hoursUntilExpiry)->toBeGreaterThan(167); // 6d23h
    expect($hoursUntilExpiry)->toBeLessThanOrEqual(168 + 1); // 7d
});

it('all tokens revoked when is_super_admin changes from false to true', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'switch@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => false,
    ]);

    // Mint a couple of tokens.
    (new LoginAction())('switch@mypos.test', 'secret-pass', '127.0.0.1');
    $user->createToken('staff-mobile', ['tenant:full'], now()->addDays(7));

    expect($user->tokens()->count())->toBeGreaterThanOrEqual(1);

    // Promote to super admin — observer/hook must wipe tokens to cut off any
    // session that was minted before the privilege change.
    $user->update(['is_super_admin' => true]);

    expect($user->fresh()->tokens()->count())->toBe(0);
});

it('all tokens revoked when is_super_admin changes from true to false', function (): void {
    $admin = User::factory()->create([
        'email' => 'demote@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true,
    ]);

    // Issue the high-privilege token (super-admin ability).
    $admin->createToken('super-admin-web', ['super-admin'], now()->addHour());
    $admin->createToken('extra-session', ['super-admin'], now()->addHour());

    expect($admin->tokens()->count())->toBe(2);

    $admin->update(['is_super_admin' => false]);

    expect($admin->fresh()->tokens()->count())->toBe(0);
});

it('does NOT revoke tokens on unrelated User updates', function (): void {
    $user = User::factory()->create([
        'is_super_admin' => false,
        'name' => 'Original',
    ]);
    $user->createToken('keep-me', ['tenant:full'], now()->addDays(7));

    expect($user->tokens()->count())->toBe(1);

    $user->update(['name' => 'Renamed']);

    expect($user->fresh()->tokens()->count())->toBe(1);
});

it('LoginAction revokes previous web-session token before issuing a new one', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'reuse@mypos.test',
        'password' => Hash::make('secret-pass'),
    ]);

    (new LoginAction())('reuse@mypos.test', 'secret-pass', '127.0.0.1');
    (new LoginAction())('reuse@mypos.test', 'secret-pass', '127.0.0.1');
    (new LoginAction())('reuse@mypos.test', 'secret-pass', '127.0.0.1');

    // Only one web-session token must remain (the latest).
    expect($user->fresh()->tokens()->where('name', 'web-session')->count())->toBe(1);
});

it('SuperAdminLoginAction revokes previous super-admin-web token before issuing new one', function (): void {
    $admin = User::factory()->create([
        'email' => 'multi@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true,
    ]);

    (new SuperAdminLoginAction())('multi@mypos.test', 'secret-pass', '127.0.0.1');
    (new SuperAdminLoginAction())('multi@mypos.test', 'secret-pass', '127.0.0.1');

    expect($admin->fresh()->tokens()->where('name', 'super-admin-web')->count())->toBe(1);
});

it('expired super-admin token is rejected by the middleware', function (): void {
    $admin = actingAsSuperAdmin();
    $expired = $admin->createToken('super-admin-web', ['super-admin'], now()->subMinute());

    $this->withHeader('Authorization', 'Bearer ' . $expired->plainTextToken)
        ->getJson('/api/v1/super-admin/me')
        ->assertStatus(401);
});

it('the EnsureSuperAdmin middleware rejects unauthenticated requests with 401', function (): void {
    $this->getJson('/api/v1/super-admin/me')->assertStatus(401);
});

it('the EnsureSuperAdmin middleware rejects authenticated tenant users with 403', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner, ['tenant:full']);

    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);
});

it('a token with empty abilities array is also rejected', function (): void {
    $admin = User::factory()->create([
        'is_super_admin' => true,
    ]);
    Sanctum::actingAs($admin, []);

    $this->getJson('/api/v1/super-admin/me')->assertStatus(403);
});
