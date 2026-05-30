<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Models\Payment;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/cashflow')->assertStatus(401);
});

it('groups captured payments by day', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id]);

    Payment::factory()->captured()->count(2)->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'amount' => 50_000,
        'created_at' => now(),
    ]);
    Payment::factory()->captured()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'amount' => 75_000,
        'created_at' => now()->subDay(),
    ]);

    $response = $this->getJson('/api/v1/reports/cashflow?group_by=day')->assertOk();

    $series = $response->json('data.series');
    expect(count($series))->toBeGreaterThanOrEqual(2);

    $today = collect($series)->firstWhere('period', now()->toDateString());
    expect($today['inflow_minor'])->toBe(100_000);
    expect($today['transactions'])->toBe(2);
    expect($today['outflow_minor'])->toBe(0);
});

it('returns by_provider breakdown with percentages', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id]);

    Payment::factory()->captured()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => 'cash',
        'amount' => 60_000,
    ]);
    Payment::factory()->captured()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => 'click',
        'amount' => 40_000,
    ]);

    $response = $this->getJson('/api/v1/reports/cashflow')->assertOk();
    $byProvider = collect($response->json('data.by_provider'));

    expect((float) $byProvider->firstWhere('provider', 'cash')['percent'])->toBe(60.0);
    expect((float) $byProvider->firstWhere('provider', 'click')['percent'])->toBe(40.0);
});

it('returns summary with totals', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id]);

    Payment::factory()->captured()->count(4)->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'amount' => 25_000,
    ]);

    $response = $this->getJson('/api/v1/reports/cashflow')->assertOk();

    expect($response->json('data.summary.total_inflow_minor'))->toBe(100_000);
    expect($response->json('data.summary.transaction_count'))->toBe(4);
    expect($response->json('data.summary.avg_transaction_minor'))->toBe(25_000);
    expect($response->json('data.summary.net_minor'))->toBe(100_000);
});

it('rejects invalid group_by', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $this->getJson('/api/v1/reports/cashflow?group_by=hour')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['group_by']);
});
