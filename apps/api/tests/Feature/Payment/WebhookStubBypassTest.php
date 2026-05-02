<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Webhook stub-mode bypass — Security regression suite (C3)
|--------------------------------------------------------------------------
|
| Originally an attacker could POST `{"sign_string":"stub_ok"}` to
| /api/v1/webhooks/click (or send Basic auth `:stub_ok` to Payme) when the
| provider secret was empty in production and have any order marked PAID.
|
| These tests pin the new behaviour:
|   1. Production + empty secret           → 500 (RuntimeException, no stub)
|   2. Local + empty secret + flag = false → SIGN CHECK FAILED (no stub)
|   3. Local + empty secret + flag = true  → legacy stub still works
|   4. Production + a real secret + bad sig → SIGN CHECK FAILED
|
| Agent A7 will expand these into per-method scenarios; this file only
| guards the stub-bypass attack class.
*/

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Providers\ClickProvider;
use App\Domain\Payment\Providers\PaymeProvider;

/*
|--------------------------------------------------------------------------
| Click
|--------------------------------------------------------------------------
*/

it('refuses Click stub mode in production even with empty secret (attack blocked)', function (): void {
    // Simulate production
    app()->detectEnvironment(fn () => 'production');

    config()->set('services.click.secret_key', '');
    config()->set('payment.allow_stub_webhooks', true); // even with the flag ON, production must refuse

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $response = $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'ATTACK-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ]);

    // RuntimeException bubbles out of the controller → 500.  The crucial
    // assertion is "NOT 200 with ERROR_SUCCESS" — the attacker no longer
    // wins.
    expect($response->getStatusCode())->toBe(500);
    expect(Payment::withoutGlobalScopes()->where('provider', PaymentProvider::Click->value)->count())->toBe(0);
    expect($order->fresh()->payment_status)->not->toBe('paid');
});

it('refuses Click stub mode in local when the feature flag is off', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.click.secret_key', '');
    config()->set('payment.allow_stub_webhooks', false);

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'ATTACK-2',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ])
        ->assertOk() // Click protocol always replies 200; the rejection lives in the body
        ->assertJsonPath('error', ClickProvider::ERROR_SIGN_CHECK);

    expect(Payment::withoutGlobalScopes()->where('provider', PaymentProvider::Click->value)->count())->toBe(0);
});

it('keeps Click stub mode working in local when the feature flag is explicitly on (legacy)', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.click.secret_key', '');
    config()->set('payment.allow_stub_webhooks', true);

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 25000]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-LEGACY-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 25000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SUCCESS);
});

it('refuses Click webhooks for unknown orders without writing a poison-tenant Payment row', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.click.secret_key', 'real-secret');
    config()->set('payment.allow_stub_webhooks', false);

    // Build a valid signature for a non-existent order id
    $missingOrderId = '00000000-1111-2222-3333-444455556666';
    $signTime = '2026-04-20 12:00:00';
    $parts = ['ATTACK-3', '100', 'real-secret', $missingOrderId, '50000', (string) ClickProvider::ACTION_PREPARE, $signTime];
    $sig = md5(implode('', $parts));

    $response = $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'ATTACK-3',
        'service_id' => '100',
        'merchant_trans_id' => $missingOrderId,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => $signTime,
        'sign_string' => $sig,
    ]);

    expect($response->getStatusCode())->toBe(422);
    expect(Payment::withoutGlobalScopes()->count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Payme
|--------------------------------------------------------------------------
*/

it('refuses Payme stub mode in production even with empty secret (attack blocked)', function (): void {
    app()->detectEnvironment(fn () => 'production');

    config()->set('services.payme.secret_key', '');
    config()->set('payment.allow_stub_webhooks', true); // even with the flag ON, production must refuse

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $response = $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CreateTransaction',
        'params' => [
            'id' => 'PAYME-ATTACK-1',
            'time' => now()->valueOf(),
            'amount' => 50000,
            'account' => ['order_id' => $order->id],
        ],
    ], [
        'Authorization' => 'Basic ' . base64_encode('Paycom:stub_ok'),
    ]);

    // RuntimeException bubbles to 500 — but more importantly: no payment was created.
    expect($response->getStatusCode())->toBe(500);
    expect(Payment::withoutGlobalScopes()->where('provider', PaymentProvider::Payme->value)->count())->toBe(0);
    expect($order->fresh()->payment_status)->not->toBe('paid');
});

it('refuses Payme stub mode in local when the feature flag is off', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.payme.secret_key', '');
    config()->set('payment.allow_stub_webhooks', false);

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 50000, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => 'Basic ' . base64_encode('Paycom:stub_ok'),
    ])
        ->assertOk() // Payme protocol always replies 200; the rejection lives in the JSON-RPC body
        ->assertJsonPath('error.code', PaymeProvider::ERR_INVALID_AUTH);

    expect(Payment::withoutGlobalScopes()->where('provider', PaymentProvider::Payme->value)->count())->toBe(0);
});

it('keeps Payme stub mode working in local when the feature flag is explicitly on (legacy)', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.payme.secret_key', '');
    config()->set('payment.allow_stub_webhooks', true);

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 20000]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 20000, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => 'Basic ' . base64_encode('Paycom:stub_ok'),
    ])
        ->assertOk()
        ->assertJsonPath('result.allow', true);
});

it('refuses Payme CreateTransaction for unknown orders without writing a poison-tenant Payment row', function (): void {
    app()->detectEnvironment(fn () => 'local');

    config()->set('services.payme.secret_key', 'real-secret');
    config()->set('payment.allow_stub_webhooks', false);

    $missingOrderId = '00000000-1111-2222-3333-444455556666';

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 99,
        'method' => 'CreateTransaction',
        'params' => [
            'id' => 'PAYME-ATTACK-2',
            'time' => now()->valueOf(),
            'amount' => 50000,
            'account' => ['order_id' => $missingOrderId],
        ],
    ], [
        'Authorization' => 'Basic ' . base64_encode('Paycom:real-secret'),
    ])
        ->assertOk() // Payme protocol always 200; error in body
        ->assertJsonPath('error.code', PaymeProvider::ERR_CANNOT_PERFORM);

    // The crucial assertion: no Payment row written with the placeholder tenant.
    expect(Payment::withoutGlobalScopes()->count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Sanity check — production with a real secret still works
|--------------------------------------------------------------------------
*/

it('still rejects bad signatures cleanly in production when a real secret is set', function (): void {
    app()->detectEnvironment(fn () => 'production');

    config()->set('services.click.secret_key', 'real-secret');

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create(['tenant_id' => $owner->tenant_id, 'total_amount' => 50000]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'PROD-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'deadbeef',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SIGN_CHECK);

    expect(Payment::withoutGlobalScopes()->count())->toBe(0);
});
