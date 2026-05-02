<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — TenantDomain model invariants
|--------------------------------------------------------------------------
|
| Spec covered (Agent C1 migration + C3 actions):
|   - One row per (tenant, hostname). `domain` is globally unique so two
|     tenants cannot claim the same FQDN.
|   - At most one row per tenant may have `is_primary=true` (partial unique
|     index, postgres only).
|   - Soft-deleted rows are excluded from the primary uniqueness check, so
|     an owner can re-add a previously removed domain.
|   - `verification_token` is generated at creation time (never null on
|     a freshly created row).
|   - `tenant_id` FK to `tenants.id` with cascade-on-delete.
|
| Notes:
|   - Several invariants are PostgreSQL-specific (partial unique indexes,
|     RLS). Tests for those invariants skip on sqlite.
|   - The factory referenced (`TenantDomain::factory()`) is owned by Agent
|     C1 — these tests assume the standard naming convention. If it does
|     not exist yet, see assumed-dependencies note in the C7 output.
*/

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

// We deliberately use ->query()->create([...]) instead of a factory so these
// tests run before Agent C1 ships TenantDomainFactory. The Tenant factory
// already exists and is the only dependency we rely on.

it('persists a domain row with sensible defaults', function (): void {
    $tenant = Tenant::factory()->create();

    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'jome-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    expect($row->is_primary)->toBeFalse();
    expect($row->is_verified)->toBeFalse();
    expect($row->ssl_status)->toBe('pending');
    expect($row->verification_method)->toBe('txt');
});

it('cannot have two primary domains for same tenant', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique indexes are pgsql-only.');
    }

    $tenant = Tenant::factory()->create();

    TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'first-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => true,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'verified_at' => now(),
    ]);

    expect(fn () => TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'second-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => true,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('b', 40),
    ]))->toThrow(QueryException::class);
});

it('domain column is unique across all tenants', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();
    $domain = 'shared-' . bin2hex(random_bytes(3)) . '.uz';

    TenantDomain::query()->create([
        'tenant_id' => $tenantA->id,
        'domain' => $domain,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    expect(fn () => TenantDomain::query()->create([
        'tenant_id' => $tenantB->id,
        'domain' => $domain,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('b', 40),
    ]))->toThrow(QueryException::class);
});

it('soft-delete preserves uniqueness on primary so a domain can be re-added', function (): void {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique index excluding deleted_at is pgsql-only.');
    }

    $tenant = Tenant::factory()->create();

    $first = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'reuse-primary-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => true,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'verified_at' => now(),
    ]);

    // Soft-delete frees the primary slot.
    $first->delete();

    $second = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'reuse-primary-2-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => true,
        'is_verified' => true,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('b', 40),
        'verified_at' => now(),
    ]);

    expect($second->is_primary)->toBeTrue();
    expect($second->id)->not->toBe($first->id);
});

it('verification_token is required on insert', function (): void {
    $tenant = Tenant::factory()->create();

    expect(fn () => DB::table('tenant_domains')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'tenant_id' => $tenant->id,
        'domain' => 'no-token-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        // verification_token intentionally missing
        'created_at' => now(),
        'updated_at' => now(),
    ]))->toThrow(QueryException::class);
});

it('belongs to a tenant via tenant_id FK', function (): void {
    $tenant = Tenant::factory()->create();
    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'rel-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    expect($row->tenant_id)->toBe($tenant->id);
});

it('cascade-deletes when the tenant row is deleted', function (): void {
    $tenant = Tenant::factory()->create();

    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'cascade-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    // Force a hard delete on the tenant row to trigger FK cascade — soft
    // delete on Tenant would leave the children in place.
    DB::table('tenants')->where('id', $tenant->id)->delete();

    expect(TenantDomain::withTrashed()->find($row->id))->toBeNull();
    expect(DB::table('tenant_domains')->where('id', $row->id)->exists())->toBeFalse();
});

it('casts is_primary, is_verified, verified_at correctly', function (): void {
    $tenant = Tenant::factory()->create();
    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'casts-' . bin2hex(random_bytes(3)) . '.uz',
        'is_primary' => 1,
        'is_verified' => 1,
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
        'verified_at' => now(),
    ]);

    expect($row->is_primary)->toBeBool()->toBeTrue();
    expect($row->is_verified)->toBeBool()->toBeTrue();
    expect($row->verified_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('soft-deletes via deleted_at and excludes from default queries', function (): void {
    $tenant = Tenant::factory()->create();
    $row = TenantDomain::query()->create([
        'tenant_id' => $tenant->id,
        'domain' => 'soft-' . bin2hex(random_bytes(3)) . '.uz',
        'verification_method' => 'txt',
        'verification_token' => 'mypos-verify-' . str_repeat('a', 40),
    ]);

    $row->delete();

    // Tests run without an authenticated tenant context, so the BelongsToTenant
    // global scope fails closed. Drop ONLY the tenant scope so SoftDeletes still
    // filters as the test intends.
    expect(TenantDomain::query()->withoutGlobalScope('tenant')->find($row->id))->toBeNull();
    expect(TenantDomain::query()->withoutGlobalScope('tenant')->withTrashed()->find($row->id))->not->toBeNull();
});
