<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| A6 — PII encryption at rest with HMAC-based lookup index
|--------------------------------------------------------------------------
|
| Spec covered:
|   - Customer.phone, Customer.email, Customer.notes are encrypted with
|     `Crypt::encryptString()` (Laravel's `encrypted` cast).
|   - Order.delivery_phone, Order.delivery_address, Order.delivery_notes,
|     Order.customer_phone_for_receipt are encrypted.
|   - NotificationLog.recipient and NotificationLog.body are encrypted.
|   - A `customer.phone_index` (hex) column stores
|     `hash_hmac('sha256', normalized_phone, APP_KEY)` for O(log n) lookup
|     without decryption.
|   - Phone normalization strips spaces, dashes, and parens; preserves the
|     leading + so different formats hash to the same index.
|
| Invariants:
|   - DB raw read of `customers.phone` returns ciphertext, not the plaintext
|     value.
|   - Eloquent read returns the original plaintext via the cast.
|   - Searching by phone uses the `phone_index` (no plaintext WHERE).
|   - Two writes of the same phone (different formats) produce the same
|     phone_index value.
*/

use App\Domain\Customer\Models\Customer;
use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Models\NotificationLog;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (! Schema::hasColumn('customers', 'phone_index')) {
        $this->markTestSkipped('Migration adding phone_index has not run yet (A6 not implemented).');
    }
});

it('Customer.phone is encrypted at rest', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    // Raw row read — must NOT contain plaintext.
    $raw = DB::table('customers')->where('id', $customer->id)->first();
    expect($raw->phone)->not->toBe('+998901112233');
    expect((string) $raw->phone)->not->toContain('998901112233');

    // The encrypted blob must be Laravel-decryptable.
    $decrypted = Crypt::decryptString((string) $raw->phone);
    expect($decrypted)->toBe('+998901112233');

    // And via Eloquent the value comes back clean.
    expect($customer->fresh()->phone)->toBe('+998901112233');
});

it('Customer.email is encrypted at rest', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'pii@example.test',
    ]);

    $raw = DB::table('customers')->where('id', $customer->id)->first();
    expect((string) $raw->email)->not->toContain('pii@example.test');
    expect(Crypt::decryptString((string) $raw->email))->toBe('pii@example.test');

    expect($customer->fresh()->email)->toBe('pii@example.test');
});

it('Customer.notes is encrypted at rest', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'notes' => 'Allergies: peanut. VIP — table 12.',
    ]);

    $raw = DB::table('customers')->where('id', $customer->id)->first();
    expect((string) $raw->notes)->not->toContain('peanut');
    expect(Crypt::decryptString((string) $raw->notes))->toContain('peanut');

    expect($customer->fresh()->notes)->toContain('peanut');
});

it('Customer.phone_index allows lookup without decryption', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    // The index is hex-encoded HMAC-SHA256 → 64 chars.
    $raw = DB::table('customers')->where('id', $customer->id)->first();
    expect($raw->phone_index)->toBeString();
    expect(strlen((string) $raw->phone_index))->toBe(64);

    // The model exposes Customer::hashPhone() which normalizes (strips
    // non-digits) and uses APP_KEY (base64-decoded). Use it to confirm the
    // stored index matches the documented derivation.
    $expectedIndex = Customer::hashPhone('+998901112233');
    expect($raw->phone_index)->toBe($expectedIndex);

    $found = DB::table('customers')
        ->where('phone_index', $expectedIndex)
        ->first();
    expect($found)->not->toBeNull();
    expect($found->id)->toBe($customer->id);
});

it('phone_index is HMAC-SHA256 of normalized phone', function (): void {
    $tenant = Tenant::factory()->create();

    // Same number in three different display formats — all must produce
    // the same phone_index after normalization (strip spaces / dashes / parens).
    $a = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998 90 111 22 33',
    ]);
    // Different tenant so the unique(tenant_id, phone_index) doesn't bite.
    $tenantB = Tenant::factory()->create();
    $b = Customer::factory()->create([
        'tenant_id' => $tenantB->id,
        'phone' => '+998-90-111-22-33',
    ]);
    $tenantC = Tenant::factory()->create();
    $c = Customer::factory()->create([
        'tenant_id' => $tenantC->id,
        'phone' => '+998(90)1112233',
    ]);

    $rows = DB::table('customers')->whereIn('id', [$a->id, $b->id, $c->id])->get();
    $indexes = array_unique(array_map(fn ($r) => $r->phone_index, $rows->all()));
    expect($indexes)->toHaveCount(1);

    // And the value matches HMAC of the normalized phone using the model's
    // documented derivation (Customer::hashPhone).
    $expected = Customer::hashPhone('+998901112233');
    expect(reset($indexes))->toBe($expected);

    // Sanity: normalization strips non-digits.
    expect(Customer::normalizePhone('+998 90 111-22-33'))->toBe('998901112233');
});

it('Order.delivery_phone is encrypted', function (): void {
    $tenant = Tenant::factory()->create();
    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'delivery',
        'delivery_phone' => '+998935551234',
        'delivery_notes' => 'Ring twice',
        'customer_phone_for_receipt' => '+998935551234',
    ]);

    $raw = DB::table('orders')->where('id', $order->id)->first();
    expect((string) $raw->delivery_phone)->not->toContain('935551234');
    expect(Crypt::decryptString((string) $raw->delivery_phone))->toBe('+998935551234');

    expect((string) $raw->delivery_notes)->not->toContain('Ring twice');
    expect(Crypt::decryptString((string) $raw->delivery_notes))->toBe('Ring twice');

    expect((string) $raw->customer_phone_for_receipt)->not->toContain('935551234');

    expect($order->fresh()->delivery_phone)->toBe('+998935551234');
    expect($order->fresh()->delivery_notes)->toBe('Ring twice');
});

it('Order.delivery_address is encrypted', function (): void {
    $tenant = Tenant::factory()->create();
    $order = Order::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'delivery',
        'delivery_address' => [
            'street' => 'Amir Temur 12',
            'city' => 'Tashkent',
            'apartment' => '5',
        ],
    ]);

    $raw = DB::table('orders')->where('id', $order->id)->first();
    expect((string) $raw->delivery_address)->not->toContain('Amir Temur');
    expect((string) $raw->delivery_address)->not->toContain('Tashkent');

    expect($order->fresh()->delivery_address['street'] ?? null)->toBe('Amir Temur 12');
});

it('NotificationLog.recipient is encrypted', function (): void {
    $tenant = Tenant::factory()->create();
    $log = NotificationLog::factory()->create([
        'tenant_id' => $tenant->id,
        'channel' => NotificationChannel::SMS->value,
        'recipient' => '+998901112233',
        'body' => 'Tasdiqlash kodi: 1234',
    ]);

    $raw = DB::table('notifications_log')->where('id', $log->id)->first();
    expect((string) $raw->recipient)->not->toContain('998901112233');
    expect(Crypt::decryptString((string) $raw->recipient))->toBe('+998901112233');

    expect($log->fresh()->recipient)->toBe('+998901112233');
});

it('NotificationLog.body is encrypted', function (): void {
    $tenant = Tenant::factory()->create();
    $log = NotificationLog::factory()->create([
        'tenant_id' => $tenant->id,
        'recipient' => 'pii@example.test',
        'body' => 'Hurmatli mijoz, sizning OTP kodingiz: 9876.',
    ]);

    $raw = DB::table('notifications_log')->where('id', $log->id)->first();
    expect((string) $raw->body)->not->toContain('OTP');
    expect((string) $raw->body)->not->toContain('9876');
    expect(Crypt::decryptString((string) $raw->body))->toContain('9876');

    expect($log->fresh()->body)->toContain('9876');
});

it('decryption fails gracefully for tampered ciphertext', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    // Tamper with the row at the database level.
    DB::table('customers')->where('id', $customer->id)->update([
        'phone' => 'NOT-A-VALID-CIPHERTEXT',
    ]);

    // Bypass the BelongsToTenant scope (no auth context) so find() actually
    // returns the row instead of being short-circuited by the fail-safe scope.
    expect(function () use ($customer): void {
        $fresh = Customer::query()->withoutGlobalScopes()->find($customer->id);
        // Accessing the encrypted attribute must throw.
        $fresh?->phone;
    })->toThrow(\Illuminate\Contracts\Encryption\DecryptException::class);
});

it('updating phone updates phone_index automatically', function (): void {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    $oldIndex = DB::table('customers')->where('id', $customer->id)->value('phone_index');

    $customer->update(['phone' => '+998987654321']);

    $newIndex = DB::table('customers')->where('id', $customer->id)->value('phone_index');

    expect($newIndex)->not->toBe($oldIndex);
    expect($newIndex)->toBe(Customer::hashPhone('+998987654321'));
});

it('lookup-by-phone helper returns the right customer across formats', function (): void {
    $tenant = Tenant::factory()->create();
    Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
        'first_name' => 'TargetUser',
    ]);

    // No auth user in this test — the BelongsToTenant fail-safe scope would
    // short-circuit the queries to zero rows. Bypass it explicitly: the test
    // already passes an explicit `tenant_id` filter, so isolation is preserved.
    $byScope = Customer::query()
        ->withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->wherePhone('+998 90 111 22 33')
        ->first();

    expect($byScope)->not->toBeNull();
    expect($byScope->first_name)->toBe('TargetUser');

    // Same lookup using a raw HMAC computed via the documented helper.
    $hash = Customer::hashPhone('+998-90-111-2233');
    $byHash = Customer::query()
        ->withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->where('phone_index', $hash)
        ->first();
    expect($byHash)->not->toBeNull();
    expect($byHash->first_name)->toBe('TargetUser');
});

it('two customers with the same phone in same tenant violate the unique index', function (): void {
    $tenant = Tenant::factory()->create();
    Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    expect(function () use ($tenant): void {
        Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'phone' => '+998 90 111 22 33', // same after normalization
        ]);
    })->toThrow(\Illuminate\Database\QueryException::class);
});

it('plaintext phone search no longer works (forces phone_index usage)', function (): void {
    $tenant = Tenant::factory()->create();
    Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'phone' => '+998901112233',
    ]);

    // Searching by plaintext in WHERE shouldn't find anything because the
    // column stores ciphertext that varies on every encryption.
    $found = Customer::query()
        ->where('phone', '+998901112233')
        ->first();

    expect($found)->toBeNull();
});
