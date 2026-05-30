<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/orders')->assertStatus(401);
});

it('paginates tenant orders', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Order::factory()->count(5)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'total_amount' => 25_000,
    ]);

    $response = $this->getJson('/api/v1/reports/orders?per_page=3')->assertOk();

    expect($response->json('data'))->toHaveCount(3);
    expect($response->json('meta.total'))->toBe(5);
});

it('returns a summary covering the filtered set', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->count(4)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'total_amount' => 30_000,
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 999_999,
    ]);

    $response = $this->getJson('/api/v1/reports/orders')->assertOk();

    expect($response->json('meta.summary.count'))->toBe(4);
    expect($response->json('meta.summary.revenue_minor'))->toBe(120_000);
    expect($response->json('meta.summary.avg_ticket_minor'))->toBe(30_000);
});

it('filters by status', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Order::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
    ]);

    $response = $this->getJson('/api/v1/reports/orders?status=cancelled')->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

it('filters by type', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Order::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'type' => 'delivery',
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'type' => 'dine_in',
    ]);

    $response = $this->getJson('/api/v1/reports/orders?type=delivery')->assertOk();
    expect($response->json('meta.total'))->toBe(2);
});

it('filters by payment method', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'payment_method' => 'cash',
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'payment_method' => 'click',
    ]);

    $response = $this->getJson('/api/v1/reports/orders?payment_method=cash')->assertOk();
    expect($response->json('meta.total'))->toBe(3);
});

it('searches by order_no via q', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_no' => 'O240528-TARGET',
    ]);
    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
    ]);

    $response = $this->getJson('/api/v1/reports/orders?q=TARGET')->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

it('rejects invalid status values via validation', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->getJson('/api/v1/reports/orders?status=bogus')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});
