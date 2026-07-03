<?php

declare(strict_types=1);

use App\Domain\SuperAdmin\Models\AuditLog;
use App\Domain\SuperAdmin\Models\SuperAdminInvitation;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::findOrCreate('super_admin', 'web');
    RateLimiter::clear('throttle:5,15');
});

it('lists existing super admins', function (): void {
    User::factory()->count(2)->create(['is_super_admin' => true]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/admins')->assertOk();

    expect(count($response->json('data')))->toBeGreaterThanOrEqual(3);
});

it('creates an invitation and returns the plain token once', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->postJson('/api/v1/super-admin/admins/invite', [
        'email' => 'newadmin@mypos.test',
        'role' => 'support',
    ])->assertCreated();

    $token = $response->json('data.token');
    expect($token)->toBeString()->not->toBeEmpty();

    $invitation = SuperAdminInvitation::query()
        ->where('email', 'newadmin@mypos.test')
        ->first();
    expect($invitation)->not->toBeNull();
    expect($invitation->token_hash)->toBe(SuperAdminInvitation::hashToken($token));

    expect(AuditLog::query()->where('action', 'super_admin.invited')->count())->toBe(1);
});

it('rejects invite when email is already a super admin', function (): void {
    User::factory()->create([
        'email' => 'existing@mypos.test',
        'is_super_admin' => true,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->postJson('/api/v1/super-admin/admins/invite', [
        'email' => 'existing@mypos.test',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);
});

it('accepts an invitation and creates a super admin user', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $invite = $this->postJson('/api/v1/super-admin/admins/invite', [
        'email' => 'fresh@mypos.test',
        'role' => 'finance',
    ])->assertCreated();

    $token = $invite->json('data.token');

    // Acceptance is public — clear current authentication context.
    auth()->forgetGuards();

    $accept = $this->postJson('/api/v1/super-admin/admins/accept-invitation', [
        'token' => $token,
        'name' => 'Fresh Admin',
        'password' => 'super-strong-pass',
    ])->assertOk();

    expect($accept->json('data.user.email'))->toBe('fresh@mypos.test');
    expect($accept->json('data.role'))->toBe('finance');
    expect($accept->json('data.token'))->toBeString()->not->toBeEmpty();

    $user = User::query()->where('email', 'fresh@mypos.test')->first();
    expect($user)->not->toBeNull();
    expect($user->is_super_admin)->toBeTrue();
    expect($user->super_admin_role)->toBe('finance');
});

it('rejects accept-invitation with invalid token', function (): void {
    $this->postJson('/api/v1/super-admin/admins/accept-invitation', [
        'token' => str_repeat('x', 48),
        // Otherwise-valid payload so only the token can fail validation.
        'name' => 'Xavier',
        'password' => 'super-strong-pass',
    ])->assertStatus(422)->assertJsonValidationErrors(['token']);
});

it('revokes super admin role from another user', function (): void {
    $target = User::factory()->create([
        'is_super_admin' => true,
        'super_admin_role' => 'support',
    ]);
    $target->assignRole('super_admin');

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->deleteJson('/api/v1/super-admin/admins/'.$target->uuid)->assertOk();

    expect($target->fresh()->is_super_admin)->toBeFalse();
    expect($target->fresh()->super_admin_role)->toBeNull();

    expect(AuditLog::query()->where('action', 'super_admin.revoked')->count())->toBe(1);
});

it('forbids self-revoke', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $this->deleteJson('/api/v1/super-admin/admins/'.$admin->uuid)
        ->assertStatus(422);
});
