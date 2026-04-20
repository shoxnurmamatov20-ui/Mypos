<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use Laravel\Sanctum\Sanctum;

it('requires authentication', function (): void {
    $this->postJson('/api/v1/payments', [])->assertStatus(401);
});

it('creates a cash payment intent without a payment_url', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 50000,
    ]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/payments', [
        'order_id' => $order->id,
        'provider' => PaymentProvider::Cash->value,
    ])
        ->assertCreated()
        ->assertJsonPath('data.payment.provider', 'cash')
        ->assertJsonPath('data.payment.status', PaymentStatus::Pending->value)
        ->assertJsonPath('data.payment.amount', 50000)
        ->assertJsonPath('data.payment_url', null);

    expect(Payment::query()->count())->toBe(1);
});

it('creates a click payment intent with a payment url', function (): void {
    config()->set('services.click.service_id', '12345');
    config()->set('services.click.merchant_id', '67890');

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 75000,
    ]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/payments', [
        'order_id' => $order->id,
        'provider' => PaymentProvider::Click->value,
    ])->assertCreated();

    $url = $response->json('data.payment_url');
    expect($url)->toContain('my.click.uz/services/pay');
    expect($url)->toContain('service_id=12345');
    expect($url)->toContain('merchant_id=67890');
    expect($url)->toContain('amount=75000');
    expect($url)->toContain((string) $order->id);
});

it('creates a payme payment intent with a base64-encoded url', function (): void {
    config()->set('services.payme.merchant_id', 'merchant-xyz');
    config()->set('services.payme.test_mode', true);

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 30000,
    ]);
    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/payments', [
        'order_id' => $order->id,
        'provider' => PaymentProvider::Payme->value,
    ])->assertCreated();

    $url = (string) $response->json('data.payment_url');
    expect($url)->toStartWith('https://test.paycom.uz/');

    $encoded = substr($url, strlen('https://test.paycom.uz/'));
    $decoded = base64_decode($encoded, true);
    expect($decoded)->toContain('m=merchant-xyz');
    expect($decoded)->toContain('ac.order_id=' . $order->id);
    expect($decoded)->toContain('a=30000');
});

it('rejects an unknown provider', function (): void {
    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/payments', [
        'order_id' => $order->id,
        'provider' => 'bitcoin',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['provider']);
});

it('rejects missing order_id', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/payments', [
        'provider' => PaymentProvider::Cash->value,
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['order_id']);
});
