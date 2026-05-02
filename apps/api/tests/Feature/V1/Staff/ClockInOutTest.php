<?php

declare(strict_types=1);

use App\Domain\Employee\Models\Shift;
use Laravel\Sanctum\Sanctum;

it('clocks in and creates an open shift if none exists', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/staff/clock-in')
        ->assertCreated()
        ->assertJsonStructure(['data' => ['shift' => ['id', 'actual_start', 'status']]]);

    $shiftId = $response->json('data.shift.id');
    expect($shiftId)->toBeString();
    expect(Shift::query()->where('id', $shiftId)->where('employee_id', $employee->id)->exists())->toBeTrue();

    $employee->refresh();
    expect($employee->last_clock_in_at)->not->toBeNull();
});

it('clocks out and sets actual_end + worked_minutes', function (): void {
    ['user' => $user, 'employee' => $employee] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    Shift::factory()->open()->create([
        'tenant_id' => $employee->tenant_id,
        'employee_id' => $employee->id,
        'actual_start' => now()->subMinutes(60),
    ]);

    $response = $this->postJson('/api/v1/staff/clock-out')
        ->assertOk()
        ->assertJsonStructure(['data' => ['shift', 'worked_minutes']]);

    expect($response->json('data.worked_minutes'))->toBeGreaterThanOrEqual(50);
});

it('rejects clock-out when no open shift exists', function (): void {
    ['user' => $user] = actingAsStaff('waiter');
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/clock-out')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['shift']);
});

it('returns 401 for unauthenticated clock-in', function (): void {
    $this->postJson('/api/v1/staff/clock-in')->assertStatus(401);
});

it('returns 403 if the user has no active employee record', function (): void {
    $user = \App\Models\User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/clock-in')->assertStatus(403);
});
