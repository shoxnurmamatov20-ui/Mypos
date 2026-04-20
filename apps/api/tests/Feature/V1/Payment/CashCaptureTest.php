<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use Laravel\Sanctum\Sanctum;

it('captures a cash payment and marks order paid', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 120000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);
    $payment = Payment::factory()->pending()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Cash->value,
        'amount' => 120000,
    ]);
    Sanctum::actingAs($owner);

    $this->postJson("/api/v1/payments/{$payment->id}/capture")
        ->assertOk()
        ->assertJsonPath('data.status', PaymentStatus::Captured->value)
        ->assertJsonPath('data.provider', 'cash');

    $order->refresh();
    expect($order->payment_status)->toBe('paid');
    expect($order->paid_amount)->toBe(120000);
    expect($order->payment_method)->toBe('cash');
    expect($order->paid_at)->not->toBeNull();
});

it('marks order as partial when cash partial payment is captured', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 100000,
        'paid_amount' => 0,
        'payment_status' => 'unpaid',
    ]);
    $payment = Payment::factory()->pending()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Cash->value,
        'amount' => 40000,
    ]);
    Sanctum::actingAs($owner);

    $this->postJson("/api/v1/payments/{$payment->id}/capture")->assertOk();

    $order->refresh();
    expect($order->payment_status)->toBe('partial');
    expect($order->paid_amount)->toBe(40000);
});

it('rejects capture on non-cash providers', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id]);
    $payment = Payment::factory()->pending()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'provider' => PaymentProvider::Click->value,
    ]);
    Sanctum::actingAs($owner);

    $this->postJson("/api/v1/payments/{$payment->id}/capture")->assertStatus(422);
});

it('returns 401 when unauthenticated', function (): void {
    $this->postJson('/api/v1/payments/00000000-0000-0000-0000-000000000000/capture')
        ->assertStatus(401);
});
