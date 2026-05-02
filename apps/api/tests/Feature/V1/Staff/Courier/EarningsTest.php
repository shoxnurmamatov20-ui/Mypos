<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('aggregates today earnings only from delivered orders', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    Order::factory()->count(3)->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->setTime(12, 0),
        'courier_earnings_minor' => 4_000,
        'tip_amount' => 0,
        'delivery_distance_meters' => 1_500,
    ]);

    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'delivered_at' => null,
        'courier_earnings_minor' => 9_999,
    ]);

    $response = $this->getJson('/api/v1/staff/courier/earnings?period=today')
        ->assertOk();

    expect($response->json('data.deliveries_count'))->toBe(3);
    expect($response->json('data.total_earnings_minor'))->toBe(12_000);
    expect($response->json('data.avg_per_delivery_minor'))->toBe(4_000);
    expect($response->json('data.total_distance_meters'))->toBe(4_500);
    expect($response->json('data.by_day'))->toHaveCount(1);
});

it('groups earnings by day for week period', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $monday = now()->startOfWeek();

    Order::factory()->count(2)->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => $monday,
        'courier_earnings_minor' => 5_000,
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => $monday->copy()->addDay(),
        'courier_earnings_minor' => 7_000,
    ]);

    $response = $this->getJson('/api/v1/staff/courier/earnings?period=week')
        ->assertOk();

    expect($response->json('data.deliveries_count'))->toBe(3);
    expect($response->json('data.total_earnings_minor'))->toBe(17_000);
    $byDay = $response->json('data.by_day');
    expect($byDay)->toHaveCount(2);
});

it('returns zeros when no deliveries exist', function (): void {
    ['user' => $user] = actingAsCourier();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/staff/courier/earnings?period=month')
        ->assertOk();

    expect($response->json('data.deliveries_count'))->toBe(0);
    expect($response->json('data.total_earnings_minor'))->toBe(0);
    expect($response->json('data.avg_per_delivery_minor'))->toBe(0);
});

it('rejects an invalid period', function (): void {
    ['user' => $user] = actingAsCourier();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/staff/courier/earnings?period=year')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['period']);
});
