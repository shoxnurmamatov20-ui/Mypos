<?php

declare(strict_types=1);

use App\Domain\SuperAdmin\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function (): void {
    // Best-effort: clear any RateLimiter keys for the test emails.
    foreach (['admin@mypos.test', 'tenant@mypos.test'] as $email) {
        foreach (['127.0.0.1', '127.0.0.2', null] as $ip) {
            $key = 'super-admin-login:' . sha1(strtolower($email) . '|' . ($ip ?? 'unknown'));
            RateLimiter::clear($key);
        }
    }
    // Defensive — Laravel's array cache (used in tests) may not enumerate keys.
    Cache::flush();
});

it('logs a super admin in with correct credentials', function (): void {
    $admin = User::factory()->create([
        'email' => 'admin@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => true,
        'super_admin_role' => 'admin',
    ]);

    $response = $this->postJson('/api/v1/super-admin/login', [
        'email' => 'admin@mypos.test',
        'password' => 'secret-pass',
    ]);

    $response
        ->assertOk()
        ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'email'], 'role']]);

    expect($response->json('data.user.id'))->toBe($admin->uuid);
    expect($response->json('data.role'))->toBe('admin');
    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();

    expect($admin->fresh()->last_super_admin_login_at)->not->toBeNull();

    expect(AuditLog::query()->where('action', 'super_admin.login')->count())->toBe(1);
});

it('rejects login with wrong password', function (): void {
    User::factory()->create([
        'email' => 'admin@mypos.test',
        'password' => Hash::make('correct-pass'),
        'is_super_admin' => true,
    ]);

    $this->postJson('/api/v1/super-admin/login', [
        'email' => 'admin@mypos.test',
        'password' => 'wrong-pass',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);

    expect(AuditLog::query()->where('action', 'super_admin.login_failed')->count())->toBe(1);
});

it('rejects non-super-admin user even with correct password', function (): void {
    User::factory()->create([
        'email' => 'tenant@mypos.test',
        'password' => Hash::make('secret-pass'),
        'is_super_admin' => false,
    ]);

    $this->postJson('/api/v1/super-admin/login', [
        'email' => 'tenant@mypos.test',
        'password' => 'secret-pass',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);
});

it('rate-limits login after 5 failed attempts', function (): void {
    User::factory()->create([
        'email' => 'admin@mypos.test',
        'password' => Hash::make('correct-pass'),
        'is_super_admin' => true,
    ]);

    $payload = [
        'email' => 'admin@mypos.test',
        'password' => 'wrong-pass',
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/super-admin/login', $payload)->assertStatus(422);
    }

    $this->postJson('/api/v1/super-admin/login', $payload)->assertStatus(429);
});

it('validates required fields', function (): void {
    $this->postJson('/api/v1/super-admin/login', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});
