<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/courier')->assertStatus(401);
});

it('returns the tier-locked response for free-plan tenants', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    // factory default tier = 'free' (see TenantFactory)
    $response = $this->getJson('/api/v1/reports/courier')->assertOk();

    expect($response->json('data'))->toBe([]);
    expect($response->json('meta.locked'))->toBeTrue();
    expect($response->json('meta.required_tier'))->toBe('pro');
});

it('aggregates per courier for tenants on paid tiers', function (): void {
    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'pro'])->save();
    Sanctum::actingAs($owner);

    $courierA = actingAsStaff('courier', $owner->tenant);
    $courierB = actingAsStaff('courier', $owner->tenant);

    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'courier_id' => $courierA['employee']->id,
        'status' => 'completed',
        'type' => 'delivery',
        'total_amount' => 80_000,
        'picked_up_at' => now()->subMinutes(40),
        'delivered_at' => now()->subMinutes(10),
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'courier_id' => $courierB['employee']->id,
        'status' => 'completed',
        'type' => 'delivery',
        'total_amount' => 50_000,
    ]);

    $response = $this->getJson('/api/v1/reports/courier')->assertOk();

    expect($response->json('meta.locked'))->toBeFalse();
    expect($response->json('data'))->toHaveCount(2);

    // Sorted by -deliveries → courierA first (3 deliveries)
    expect($response->json('data.0.deliveries_count'))->toBe(3);
    expect($response->json('data.0.revenue_delivered_minor'))->toBe(240_000);
    expect($response->json('meta.total_deliveries'))->toBe(4);
});
