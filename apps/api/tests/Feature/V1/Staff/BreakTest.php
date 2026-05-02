<?php

declare(strict_types=1);

use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use Laravel\Sanctum\Sanctum;

it('starts a break inside an active shift', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    Shift::factory()->open()->create([
        'tenant_id' => $employee->tenant_id,
        'employee_id' => $employee->id,
        'actual_start' => now()->subMinutes(30),
    ]);

    $response = $this->postJson('/api/v1/staff/breaks/start', ['reason' => 'lunch'])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'started_at', 'ended_at', 'is_open']]);

    expect($response->json('data.is_open'))->toBeTrue();
    expect($response->json('data.reason.value'))->toBe('lunch');
});

it('rejects starting a break without an active shift', function (): void {
    ['user' => $user] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/breaks/start')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['shift']);
});

it('rejects starting a second break while one is open', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $shift = Shift::factory()->open()->create([
        'tenant_id' => $employee->tenant_id,
        'employee_id' => $employee->id,
        'actual_start' => now()->subMinutes(30),
    ]);
    ShiftBreak::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'shift_id' => $shift->id,
        'employee_id' => $employee->id,
        'started_at' => now()->subMinutes(5),
        'ended_at' => null,
    ]);

    $this->postJson('/api/v1/staff/breaks/start', ['reason' => 'rest'])
        ->assertStatus(409);
});

it('ends an open break and computes duration_minutes', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $shift = Shift::factory()->open()->create([
        'tenant_id' => $employee->tenant_id,
        'employee_id' => $employee->id,
        'actual_start' => now()->subMinutes(60),
    ]);
    ShiftBreak::factory()->create([
        'tenant_id' => $employee->tenant_id,
        'shift_id' => $shift->id,
        'employee_id' => $employee->id,
        'started_at' => now()->subMinutes(20),
        'ended_at' => null,
    ]);

    $response = $this->postJson('/api/v1/staff/breaks/end')
        ->assertOk()
        ->assertJsonStructure(['data' => ['ended_at', 'duration_minutes']]);

    expect($response->json('data.duration_minutes'))->toBeGreaterThanOrEqual(15);
    expect($response->json('data.is_open'))->toBeFalse();
});

it('rejects ending a break when none is open', function (): void {
    ['user' => $user] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/breaks/end')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['break']);
});
