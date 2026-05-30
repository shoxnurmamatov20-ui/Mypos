<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/cancelled')->assertStatus(401);
});

it('lists cancelled orders with summary', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 50_000,
        'cancelled_at' => now(),
        'notes' => 'Mijoz fikrini o\'zgartirdi',
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
        'total_amount' => 999_999,
    ]);

    $response = $this->getJson('/api/v1/reports/cancelled')->assertOk();

    expect($response->json('data.orders'))->toHaveCount(3);
    expect($response->json('data.summary.orders_count'))->toBe(3);
    expect($response->json('data.summary.total_loss_minor'))->toBeGreaterThanOrEqual(150_000);
});

it('groups cancellation reasons', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    Order::factory()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 30_000,
        'notes' => 'Mahsulot tugadi',
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 60_000,
        'notes' => 'Mijoz fikrini o\'zgartirdi',
    ]);
    // No notes — should fold into "Sabab ko'rsatilmagan"
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'cancelled',
        'total_amount' => 20_000,
        'notes' => null,
    ]);

    $response = $this->getJson('/api/v1/reports/cancelled')->assertOk();

    $byReason = collect($response->json('data.by_reason'));
    expect($byReason)->toHaveCount(3);

    $tugadi = $byReason->firstWhere('reason', 'Mahsulot tugadi');
    expect($tugadi['count'])->toBe(2);
    expect($tugadi['loss_minor'])->toBe(60_000);

    $unspecified = $byReason->firstWhere('reason', "Sabab ko'rsatilmagan");
    expect($unspecified)->not->toBeNull();
    expect($unspecified['count'])->toBe(1);
});

it('lists cancelled line items', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'completed',
    ]);
    OrderItem::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'name_snapshot' => 'Plov',
        'quantity' => 2,
        'price_amount' => 30_000,
        'subtotal_amount' => 60_000,
        'status' => 'cancelled',
    ]);

    $response = $this->getJson('/api/v1/reports/cancelled')->assertOk();
    expect($response->json('data.items'))->toHaveCount(1);
    expect($response->json('data.items.0.menu_item_name'))->toBe('Plov');
    expect($response->json('data.items.0.total_loss_minor'))->toBe(60_000);
});
