<?php

declare(strict_types=1);

use App\Domain\Employee\Models\CourierLocation;
use Laravel\Sanctum\Sanctum;

it('records a courier GPS reading', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $payload = [
        'lat' => 41.3111,
        'lng' => 69.2406,
        'accuracy_meters' => 8.4,
        'heading' => 180,
        'speed_mps' => 5.4,
        'battery_percent' => 76,
        'recorded_at' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/v1/staff/courier/location', $payload)
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id']]);

    $id = $response->json('data.id');
    expect($id)->toBeString();

    $row = CourierLocation::query()->whereKey($id)->first();
    expect($row)->not->toBeNull();
    expect($row->employee_id)->toBe($courier->id);
    expect($row->tenant_id)->toBe($courier->tenant_id);
    expect((float) $row->lat)->toEqualWithDelta(41.3111, 0.0001);
});

it('rejects out-of-range coordinates', function (): void {
    ['user' => $user] = actingAsCourier();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/courier/location', [
        'lat' => 500,
        'lng' => 0,
    ])->assertStatus(422)->assertJsonValidationErrors(['lat']);

    $this->postJson('/api/v1/staff/courier/location', [
        'lat' => 0,
        'lng' => -500,
    ])->assertStatus(422)->assertJsonValidationErrors(['lng']);
});

it('blocks non-couriers', function (): void {
    ['user' => $user] = actingAsStaff('cook');
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/staff/courier/location', [
        'lat' => 41.3,
        'lng' => 69.2,
    ])->assertForbidden();
});
