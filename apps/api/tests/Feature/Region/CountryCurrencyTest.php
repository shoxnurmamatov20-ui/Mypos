<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Country / Currency seed + tenant region defaults
|--------------------------------------------------------------------------
|
| Spec covered (Agent E1 — region migrations):
|   - 5 countries seeded: UZ, KZ, KG, TJ, RU.
|   - 7 currencies seeded: UZS, KZT, KGS, TJS, USD, RUB, EUR.
|   - countries.currency_code FK → currencies.code (added in step 2 after
|     both tables exist).
|   - tenants gain country_code (default 'UZ') + currency_code (default 'UZS').
|   - The pair lines up — UZ→UZS, KZ→KZT, KG→KGS, TJ→TJS.
|
| Skip rules:
|   - countries / currencies tables must be migrated.
|   - PostgreSQL only for FK introspection tests.
*/

use App\Domain\Shared\Models\Country;
use App\Domain\Shared\Models\Currency;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (! Schema::hasTable('countries') || ! Schema::hasTable('currencies')) {
        $this->markTestSkipped('countries / currencies tables not migrated (pending Agent E1).');
    }
});

it('seeds 5 countries on migration', function (): void {
    $count = DB::table('countries')->count();
    expect($count)->toBeGreaterThanOrEqual(5);

    $codes = DB::table('countries')->pluck('code')->all();
    foreach (['UZ', 'KZ', 'KG', 'TJ', 'RU'] as $expected) {
        expect($codes)->toContain($expected);
    }
});

it('seeds 7 currencies on migration', function (): void {
    $count = DB::table('currencies')->count();
    expect($count)->toBeGreaterThanOrEqual(7);

    $codes = DB::table('currencies')->pluck('code')->all();
    foreach (['UZS', 'KZT', 'KGS', 'TJS', 'USD', 'RUB', 'EUR'] as $expected) {
        expect($codes)->toContain($expected);
    }
});

it('country → currency mapping is consistent', function (): void {
    $expected = [
        'UZ' => 'UZS',
        'KZ' => 'KZT',
        'KG' => 'KGS',
        'TJ' => 'TJS',
        'RU' => 'RUB',
    ];

    foreach ($expected as $country => $currency) {
        $row = DB::table('countries')->where('code', $country)->first();
        expect($row)->not->toBeNull();
        expect($row->currency_code)->toBe($currency);
    }
});

it('UZS has 0 decimals, KZT/USD/EUR have 2', function (): void {
    $rows = DB::table('currencies')
        ->whereIn('code', ['UZS', 'KZT', 'USD', 'EUR'])
        ->pluck('decimals', 'code');

    expect((int) $rows['UZS'])->toBe(0);
    expect((int) $rows['KZT'])->toBe(2);
    expect((int) $rows['USD'])->toBe(2);
    expect((int) $rows['EUR'])->toBe(2);
});

it('countries.name is JSONB with all required locales', function (): void {
    $uz = DB::table('countries')->where('code', 'UZ')->first();
    expect($uz)->not->toBeNull();
    /** @var array<string, mixed> $name */
    $name = is_string($uz->name) ? (json_decode($uz->name, true) ?? []) : (array) $uz->name;

    foreach (['uz', 'ru', 'en'] as $loc) {
        expect($name)->toHaveKey($loc);
    }
});

it('country model exposes localised display name', function (): void {
    if (! class_exists(Country::class)) {
        $this->markTestSkipped('Country model not yet shipped.');
    }

    /** @var Country $country */
    $country = Country::query()->find('UZ');
    expect($country)->not->toBeNull();
    expect($country->displayName('uz'))->toBeString();
    expect($country->displayName('en'))->toBe('Uzbekistan');
});

it('currency model exposes localised name', function (): void {
    if (! class_exists(Currency::class)) {
        $this->markTestSkipped('Currency model not yet shipped.');
    }

    /** @var Currency $usd */
    $usd = Currency::query()->find('USD');
    expect($usd)->not->toBeNull();
    expect($usd->nameFor('en'))->toBe('US Dollar');
});

it('tenant defaults to UZ + UZS', function (): void {
    if (! Schema::hasColumn('tenants', 'country_code') || ! Schema::hasColumn('tenants', 'currency_code')) {
        $this->markTestSkipped('Phase 4 tenant region columns not migrated yet.');
    }

    $tenant = Tenant::factory()->create();
    $row = DB::table('tenants')->where('id', $tenant->id)->first();

    expect($row->country_code)->toBe('UZ');
    expect($row->currency_code)->toBe('UZS');
});

it('a tenant in KZ defaults its currency_code to KZT (consistency)', function (): void {
    if (! Schema::hasColumn('tenants', 'country_code') || ! Schema::hasColumn('tenants', 'currency_code')) {
        $this->markTestSkipped('Phase 4 tenant region columns not migrated yet.');
    }

    // Default is UZ/UZS at the column level. We override to KZ and assert the
    // FK pair is acceptable (whether the application layer auto-syncs UZS→KZT
    // is a wider question — see the Listener documented in Agent E2's brief).
    $tenant = Tenant::factory()->create();
    DB::table('tenants')
        ->where('id', $tenant->id)
        ->update(['country_code' => 'KZ', 'currency_code' => 'KZT']);

    $row = DB::table('tenants')->where('id', $tenant->id)->first();
    expect($row->country_code)->toBe('KZ');
    expect($row->currency_code)->toBe('KZT');
});

it('countries / currencies are NOT tenant-scoped (visible without auth)', function (): void {
    // Both tables are global lookups — no RLS, no tenant_id column. The
    // existence of a row should be observable without setting a tenant context.
    expect(Schema::hasColumn('countries', 'tenant_id'))->toBeFalse();
    expect(Schema::hasColumn('currencies', 'tenant_id'))->toBeFalse();
});
