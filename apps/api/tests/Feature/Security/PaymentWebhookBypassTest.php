<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| A3 — Click + Payme webhook stub-mode hardening
|--------------------------------------------------------------------------
|
| Spec covered:
|   - Both providers refuse stub-mode signatures (sign_string=stub_ok /
|     Basic-auth password=stub_ok) when running in production, even if
|     `payment.allow_stub_webhooks` is true. Production is fail-closed.
|   - Non-production accepts stub mode ONLY when `payment.allow_stub_webhooks`
|     is true AND env is `local` or `testing`.
|   - Webhook routes are throttled to 60 req/min per IP.
|   - Webhooks that reference an unknown order_id refuse to write a
|     "poison-tenant" Payment row (placeholder zero-UUID tenant_id) — they
|     respond with HTTP 422 instead.
*/

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Providers\ClickProvider;
use App\Domain\Payment\Providers\PaymeProvider;

beforeEach(function (): void {
    // Default to "no credentials configured" so we exercise the stub path.
    config()->set('services.click.service_id', '100');
    config()->set('services.click.merchant_id', '200');
    config()->set('services.click.secret_key', '');

    config()->set('services.payme.merchant_id', 'merchant-xyz');
    config()->set('services.payme.secret_key', '');

    // Allowlists empty in tests.
    config()->set('payment.click.allowed_ips', []);
    config()->set('payment.payme.allowed_ips', []);

    // Default: stub feature flag OFF — explicit opt-in only.
    config()->set('payment.allow_stub_webhooks', false);
});

function paymeStubAuth(string $key = 'stub_ok'): string
{
    return 'Basic ' . base64_encode('Paycom:' . $key);
}

it('rejects Click webhook with stub_ok in production', function (): void {
    config()->set('payment.allow_stub_webhooks', true); // even with flag ON
    app()['env'] = 'production';

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 25000,
    ]);

    // Production: ClickProvider::verifyWebhook throws, the controller turns it
    // into a 5xx response (RuntimeException); the key invariant here is that
    // no Payment row is created and the webhook does NOT acknowledge success.
    $response = $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-PROD-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 25000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ]);

    expect($response->status())->not->toBe(200);
    if ($response->status() === 200) {
        // If somehow the controller returned 200, ensure it's at least an error code.
        expect($response->json('error'))->not->toBe(ClickProvider::ERROR_SUCCESS);
    }

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', 'STUB-PROD-1')->count())
        ->toBe(0);

    app()['env'] = 'testing';
});

it('rejects Payme webhook with stub_ok in production', function (): void {
    config()->set('payment.allow_stub_webhooks', true);
    app()['env'] = 'production';

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 50000,
    ]);

    // Provider throws RuntimeException in prod when secret is empty + stub
    // requested. Controller doesn't catch verifyWebhook errors → Laravel
    // turns it into a 5xx. Either outcome (5xx or 200-with-INVALID_AUTH) is
    // acceptable as long as no payment is mutated.
    $response = $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 99,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 50000, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => paymeStubAuth(),
    ]);

    if ($response->status() === 200) {
        // Provider returned false instead of throwing → INVALID_AUTH.
        expect($response->json('error.code'))->toBe(PaymeProvider::ERR_INVALID_AUTH);
    } else {
        expect($response->status())->toBeGreaterThanOrEqual(500);
    }

    app()['env'] = 'testing';
});

it('accepts stub in local with feature flag on', function (): void {
    config()->set('payment.allow_stub_webhooks', true);
    app()['env'] = 'local';

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 30000,
    ]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-LOCAL-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 30000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SUCCESS);

    app()['env'] = 'testing';
});

it('rejects stub in local with feature flag off', function (): void {
    config()->set('payment.allow_stub_webhooks', false);
    app()['env'] = 'local';

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 30000,
    ]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-LOCAL-OFF-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 30000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ])
        ->assertOk()
        ->assertJsonPath('error', ClickProvider::ERROR_SIGN_CHECK);

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', 'STUB-LOCAL-OFF-1')->count())
        ->toBe(0);

    app()['env'] = 'testing';
});

it('rejects Payme stub in local with feature flag off', function (): void {
    config()->set('payment.allow_stub_webhooks', false);
    app()['env'] = 'local';

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 50000,
    ]);

    $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 100,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 50000, 'account' => ['order_id' => $order->id]],
    ], [
        'Authorization' => paymeStubAuth(),
    ])->assertJsonPath('error.code', PaymeProvider::ERR_INVALID_AUTH);

    app()['env'] = 'testing';
});

it('refuses payment with placeholder tenant_id when order is missing (Click)', function (): void {
    // Configure real secret so we sign properly; missing order should still
    // not pollute the payments table with a synthesized tenant_id.
    config()->set('services.click.secret_key', 'real-secret');

    $signTime = '2026-04-20 12:00:00';
    $clickTransId = 'CLK-MISSING-1';
    $orderId = '00000000-0000-0000-0000-000000000000';

    $sig = md5(
        $clickTransId . '100' . 'real-secret' . $orderId . '50000' . (string) ClickProvider::ACTION_PREPARE . $signTime,
    );

    $response = $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => $clickTransId,
        'service_id' => '100',
        'merchant_trans_id' => $orderId,
        'amount' => 50000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => $signTime,
        'sign_string' => $sig,
    ]);

    // 422 (HttpException from ClickProvider) — must NOT create a Payment row
    // with a placeholder/zero-UUID tenant_id.
    expect($response->status())->toBeIn([422, 500]);

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', $clickTransId)->count())
        ->toBe(0);
});

it('refuses payment with unknown order via Payme', function (): void {
    config()->set('services.payme.secret_key', 'real-payme-secret');

    $response = $this->postJson('/api/v1/webhooks/payme', [
        'jsonrpc' => '2.0',
        'id' => 200,
        'method' => 'CreateTransaction',
        'params' => [
            'id' => 'PAYME-MISSING-1',
            'time' => now()->valueOf(),
            'amount' => 12345,
            'account' => ['order_id' => '00000000-0000-0000-0000-000000000000'],
        ],
    ], [
        'Authorization' => 'Basic ' . base64_encode('Paycom:real-payme-secret'),
    ]);

    expect($response->status())->toBeIn([200, 500]);
    if ($response->status() === 200) {
        expect($response->json('error'))->not->toBeNull();
    }

    expect(Payment::withoutGlobalScopes()->where('provider_transaction_id', 'PAYME-MISSING-1')->count())
        ->toBe(0);
});

it('rate limits Click webhook to 60 req/min per IP', function (): void {
    \Illuminate\Support\Facades\RateLimiter::clear('throttle:60,1');

    config()->set('services.click.secret_key', 'real-secret');

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 1000,
    ]);

    $payload = [
        'click_trans_id' => 'CLK-RATE-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 1000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'wrong-sig',
    ];

    // Hit 60 times — these all 200 with error -1 because the signature is wrong.
    for ($i = 0; $i < 60; $i++) {
        $this->postJson('/api/v1/webhooks/click', $payload);
    }

    // 61st should be 429.
    $this->postJson('/api/v1/webhooks/click', $payload)->assertStatus(429);
});

it('rate limits Payme webhook to 60 req/min per IP', function (): void {
    \Illuminate\Support\Facades\RateLimiter::clear('throttle:60,1');

    config()->set('services.payme.secret_key', 'real-payme-secret');

    $payload = [
        'jsonrpc' => '2.0',
        'id' => 300,
        'method' => 'CheckPerformTransaction',
        'params' => ['amount' => 1, 'account' => ['order_id' => 'whatever']],
    ];
    $headers = ['Authorization' => 'Basic ' . base64_encode('Paycom:wrong-key')];

    for ($i = 0; $i < 60; $i++) {
        $this->postJson('/api/v1/webhooks/payme', $payload, $headers);
    }

    $this->postJson('/api/v1/webhooks/payme', $payload, $headers)->assertStatus(429);
});

it('logs a critical event when production webhook receives stub credentials', function (): void {
    config()->set('payment.allow_stub_webhooks', true);
    app()['env'] = 'production';

    // Capture log output via the spy facade — easier to assert without
    // breaking other producers in the request lifecycle.
    \Illuminate\Support\Facades\Log::spy();

    $owner = actingAsTenantOwner();
    $order = Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'total_amount' => 1000,
    ]);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'STUB-LOG-1',
        'service_id' => '100',
        'merchant_trans_id' => $order->id,
        'amount' => 1000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'stub_ok',
    ]);

    \Illuminate\Support\Facades\Log::shouldHaveReceived('critical')
        ->atLeast()
        ->once();

    app()['env'] = 'testing';
});

it('rejects webhook from non-allowlisted IP when allowlist is configured', function (): void {
    config()->set('payment.click.allowed_ips', ['10.0.0.0/8']);

    $this->postJson('/api/v1/webhooks/click', [
        'click_trans_id' => 'IP-1',
        'service_id' => '100',
        'merchant_trans_id' => 'whatever',
        'amount' => 1000,
        'action' => ClickProvider::ACTION_PREPARE,
        'sign_time' => '2026-04-20 12:00:00',
        'sign_string' => 'whatever',
    ])->assertStatus(403);
});
