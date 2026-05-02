<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns past delivered orders ordered most recent first', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    $older = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subDays(2),
    ]);
    $newer = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subHour(),
    ]);
    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'ready',
        'courier_id' => $courier->id,
        'delivered_at' => null,
    ]);

    $response = $this->getJson('/api/v1/staff/courier/history')->assertOk();
    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->toBe([$newer->id, $older->id]);
});

it('honours the from filter', function (): void {
    ['user' => $user, 'employee' => $courier] = actingAsCourier();
    Sanctum::actingAs($user);

    Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subDays(10),
    ]);
    $recent = Order::factory()->create([
        'tenant_id' => $courier->tenant_id,
        'type' => 'delivery',
        'status' => 'completed',
        'courier_id' => $courier->id,
        'delivered_at' => now()->subDay(),
    ]);

    $from = now()->subDays(2)->toDateString();
    $response = $this->getJson("/api/v1/staff/courier/history?from={$from}")->assertOk();
    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->toBe([$recent->id]);
});
