<?php

declare(strict_types=1);

use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function (): void {
    RateLimiter::clear('staff-pin:+998901112233');
});

it('logs in a staff member with correct PIN', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);
    $employee = Employee::factory()->create([
        'tenant_id' => $tenant->id,
        'user_uuid' => $user->uuid,
        'position' => 'waiter',
        'pin_code_hash' => Hash::make('1234'),
        'pin_set_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/auth/staff-login', [
        'phone' => '+998901112233',
        'pin' => '1234',
    ]);

    $response
        ->assertOk()
        ->assertJsonStructure(['data' => ['token', 'user' => ['id'], 'employee' => ['id', 'role']]]);

    expect($response->json('data.user.id'))->toBe($user->uuid);
    expect($response->json('data.employee.id'))->toBe($employee->id);
    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
});

it('rejects wrong PIN with 401', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);
    Employee::factory()->create([
        'tenant_id' => $tenant->id,
        'user_uuid' => $user->uuid,
        'pin_code_hash' => Hash::make('1234'),
    ]);

    $this->postJson('/api/v1/auth/staff-login', [
        'phone' => '+998901112233',
        'pin' => '9999',
    ])->assertStatus(401);
});

it('rejects when no employee record exists', function (): void {
    User::factory()->create(['phone' => '+998901112233']);

    $this->postJson('/api/v1/auth/staff-login', [
        'phone' => '+998901112233',
        'pin' => '1234',
    ])->assertStatus(401);
});

it('validates the phone format', function (): void {
    $this->postJson('/api/v1/auth/staff-login', [
        'phone' => 'not-a-phone',
        'pin' => '1234',
    ])->assertStatus(422)->assertJsonValidationErrors(['phone']);
});

it('validates the pin length', function (): void {
    $this->postJson('/api/v1/auth/staff-login', [
        'phone' => '+998901112233',
        'pin' => '12',
    ])->assertStatus(422)->assertJsonValidationErrors(['pin']);
});

it('rate-limits after 5 wrong attempts per phone', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);
    Employee::factory()->create([
        'tenant_id' => $tenant->id,
        'user_uuid' => $user->uuid,
        'pin_code_hash' => Hash::make('1234'),
    ]);

    $payload = ['phone' => '+998901112233', 'pin' => '0000'];

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/staff-login', $payload)->assertStatus(401);
    }

    $this->postJson('/api/v1/auth/staff-login', $payload)->assertStatus(429);
});

it('records pin attempts in staff_pin_attempts table', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);
    Employee::factory()->create([
        'tenant_id' => $tenant->id,
        'user_uuid' => $user->uuid,
        'pin_code_hash' => Hash::make('1234'),
    ]);

    $this->postJson('/api/v1/auth/staff-login', [
        'phone' => '+998901112233',
        'pin' => '1234',
    ])->assertOk();

    $this->assertDatabaseHas('staff_pin_attempts', [
        'phone' => '+998901112233',
        'success' => true,
    ]);
});
