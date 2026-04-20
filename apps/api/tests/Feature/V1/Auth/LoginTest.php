<?php

declare(strict_types=1);

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function (): void {
    RateLimiter::clear('login:127.0.0.1');
});

it('lets a user log in with correct credentials', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'owner@mypos.test',
        'password' => Hash::make('secret-pass'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => 'owner@mypos.test',
        'password' => 'secret-pass',
    ]);

    $response
        ->assertOk()
        ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'email']]]);

    expect($response->json('data.user.id'))->toBe($user->uuid);
    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
});

it('rejects login with wrong password', function (): void {
    User::factory()->create([
        'email' => 'owner@mypos.test',
        'password' => Hash::make('correct-pass'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'identifier' => 'owner@mypos.test',
        'password' => 'wrong-pass',
    ])->assertStatus(422)->assertJsonValidationErrors(['identifier']);
});

it('rejects login with non-existent email', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'identifier' => 'ghost@nowhere.test',
        'password' => 'whatever',
    ])->assertStatus(422)->assertJsonValidationErrors(['identifier']);
});

it('returns a usable sanctum token', function (): void {
    $user = User::factory()->create([
        'email' => 'owner@mypos.test',
        'password' => Hash::make('secret-pass'),
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'identifier' => 'owner@mypos.test',
        'password' => 'secret-pass',
    ])->assertOk();

    $token = $login->json('data.token');

    $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->uuid);
});

it('rate-limits login after 10 attempts per minute', function (): void {
    $payload = [
        'identifier' => 'nobody@mypos.test',
        'password' => 'whatever',
    ];

    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/v1/auth/login', $payload)->assertStatus(422);
    }

    $this->postJson('/api/v1/auth/login', $payload)->assertStatus(429);
});

it('validates that identifier and password are required', function (): void {
    $this->postJson('/api/v1/auth/login', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['identifier', 'password']);
});
