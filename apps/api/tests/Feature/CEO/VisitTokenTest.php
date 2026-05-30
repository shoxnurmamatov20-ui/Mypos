<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as MyposRole;
use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Visit\Models\VisitToken;
use App\Models\User;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Feature tests for the CEO visit-token surface.
 *
 * Tenant isolation is the load-bearing invariant here — every list/mutation
 * test verifies the CEO can NEVER read or touch tokens belonging to a
 * tenant they don't own.
 */

function makeCeo(Tenant $owns): User
{
    SpatieRole::findOrCreate(MyposRole::Ceo->value, 'web');

    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);
    $user->assignRole(MyposRole::Ceo->value);
    $user->ownedTenants()->attach($owns->id, [
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'is_primary' => true,
        'joined_at' => now(),
    ]);

    return $user;
}

function makeVisitToken(Tenant $tenant, array $overrides = []): VisitToken
{
    $raw = \Illuminate\Support\Str::random(48);

    return VisitToken::query()->create(array_merge([
        'tenant_id' => $tenant->id,
        'token_hash' => VisitToken::hashRawToken($raw),
        'expires_at' => now()->addDay(),
    ], $overrides));
}

it('lists tokens scoped to owned tenants with summary chips', function () {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $user = makeCeo($owned);

    makeVisitToken($owned, ['visit_reference' => 'VISIT-01']);
    makeVisitToken($owned, ['expires_at' => now()->subHour()]);          // expired
    makeVisitToken($owned, ['used_at' => now(), 'expires_at' => now()->addDay()]); // used
    makeVisitToken($other);  // foreign — must NOT leak

    $res = $this->actingAs($user)->getJson('/api/v1/ceo/tokens');

    $res->assertOk();
    $res->assertJsonCount(3, 'rows');
    $res->assertJsonPath('summary.total', 3);
    $res->assertJsonPath('summary.valid', 1);
    $res->assertJsonPath('summary.used', 1);
    $res->assertJsonPath('summary.expired', 1);
});

it('filters by status=valid', function () {
    $tenant = Tenant::factory()->create();
    $user = makeCeo($tenant);

    makeVisitToken($tenant);                                              // valid
    makeVisitToken($tenant, ['expires_at' => now()->subHour()]);          // expired
    makeVisitToken($tenant, ['used_at' => now()]);                        // used

    $res = $this->actingAs($user)->getJson('/api/v1/ceo/tokens?status=valid');

    $res->assertOk();
    $res->assertJsonCount(1, 'rows');
});

it('searches by visit_reference (case-insensitive, partial)', function () {
    $tenant = Tenant::factory()->create();
    $user = makeCeo($tenant);

    makeVisitToken($tenant, ['visit_reference' => 'VIP-42']);
    makeVisitToken($tenant, ['visit_reference' => 'WALKIN-7']);

    $res = $this->actingAs($user)->getJson('/api/v1/ceo/tokens?q=vip');

    $res->assertOk();
    $res->assertJsonCount(1, 'rows');
    $res->assertJsonPath('rows.0.visit_reference', 'VIP-42');
});

it('creates a batch of tokens with valid TTL', function () {
    $tenant = Tenant::factory()->create();
    $user = makeCeo($tenant);

    $res = $this->actingAs($user)->postJson('/api/v1/ceo/tokens', [
        'tenant_id' => $tenant->id,
        'visit_reference' => 'BATCH-01',
        'ttl_hours' => 12,
        'count' => 3,
    ]);

    $res->assertOk();
    $res->assertJsonPath('ok', true);
    $res->assertJsonPath('count', 3);
    expect($res->json('tokens'))->toHaveCount(3);
    expect($res->json('tokens.0.token'))->toBeString()->toHaveLength(48);
    expect($res->json('tokens.0.url'))->toStartWith('http')->toContain('/f/');

    // Server only persists the HMAC — never the raw token. The CEO user has
    // no `tenant_id`, so the BelongsToTenant scope would otherwise fail closed.
    $raw = $res->json('tokens.0.token');
    expect(
        VisitToken::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('token_hash', VisitToken::hashRawToken($raw))
            ->exists()
    )->toBeTrue();
});

it('rejects tenant_id outside the CEO ownership set', function () {
    $owned = Tenant::factory()->create();
    $foreign = Tenant::factory()->create();
    $user = makeCeo($owned);

    $res = $this->actingAs($user)->postJson('/api/v1/ceo/tokens', [
        'tenant_id' => $foreign->id,
        'count' => 1,
    ]);

    $res->assertStatus(422);
});

it('rejects table_category that does not belong to the chosen tenant', function () {
    $owned = Tenant::factory()->create();
    $foreign = Tenant::factory()->create();
    $user = makeCeo($owned);

    $foreignCat = TableCategory::query()->create([
        'tenant_id' => $foreign->id,
        'name' => ['uz' => 'Foreign Zone'],
        'slug' => 'foreign-zone',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $res = $this->actingAs($user)->postJson('/api/v1/ceo/tokens', [
        'tenant_id' => $owned->id,
        'table_category_id' => $foreignCat->id,
        'count' => 1,
    ]);

    $res->assertStatus(422);
});

it('revokes a single token by setting expires_at to now', function () {
    $tenant = Tenant::factory()->create();
    $user = makeCeo($tenant);
    $token = makeVisitToken($tenant);

    $res = $this->actingAs($user)->postJson("/api/v1/ceo/tokens/{$token->id}/revoke");

    $res->assertOk();
    expect($token->fresh()->expires_at->lessThanOrEqualTo(now()))->toBeTrue();
});

it('refuses to revoke a token for a foreign tenant', function () {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $user = makeCeo($owned);
    $foreignToken = makeVisitToken($other);

    $res = $this->actingAs($user)->postJson("/api/v1/ceo/tokens/{$foreignToken->id}/revoke");

    $res->assertStatus(404);
    expect($foreignToken->fresh()->expires_at->greaterThan(now()))->toBeTrue();
});

it('deletes a single token by id', function () {
    $tenant = Tenant::factory()->create();
    $user = makeCeo($tenant);
    $token = makeVisitToken($tenant);

    $res = $this->actingAs($user)->deleteJson("/api/v1/ceo/tokens/{$token->id}");

    $res->assertOk();
    expect(VisitToken::query()->withoutGlobalScopes()->find($token->id))->toBeNull();
});

it('bulk-revokes only tokens within owned tenants', function () {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $user = makeCeo($owned);

    $mine1 = makeVisitToken($owned);
    $mine2 = makeVisitToken($owned);
    $foreign = makeVisitToken($other);

    $res = $this->actingAs($user)->postJson('/api/v1/ceo/tokens/bulk', [
        'action' => 'revoke',
        'ids' => [$mine1->id, $mine2->id, $foreign->id],
    ]);

    $res->assertOk();
    $res->assertJsonPath('applied', 2);
    expect($mine1->fresh()->expires_at->lessThanOrEqualTo(now()))->toBeTrue();
    expect($mine2->fresh()->expires_at->lessThanOrEqualTo(now()))->toBeTrue();
    expect($foreign->fresh()->expires_at->greaterThan(now()))->toBeTrue();
});

it('returns filter options scoped to owned tenants', function () {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $user = makeCeo($owned);

    TableCategory::query()->create([
        'tenant_id' => $owned->id,
        'name' => ['uz' => 'Birinchi qavat'],
        'slug' => 'birinchi-qavat',
        'sort_order' => 1,
        'is_active' => true,
    ]);
    TableCategory::query()->create([
        'tenant_id' => $other->id,
        'name' => ['uz' => 'Foreign'],
        'slug' => 'foreign',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $res = $this->actingAs($user)->getJson('/api/v1/ceo/tokens/options');

    $res->assertOk();
    $res->assertJsonCount(1, 'data.tenants');
    $res->assertJsonPath('data.tenants.0.id', $owned->id);
    $res->assertJsonCount(1, 'data.tenants.0.categories');
});

it('denies access to non-CEO users', function () {
    SpatieRole::findOrCreate(MyposRole::Cashier->value, 'web');
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $user->assignRole(MyposRole::Cashier->value);

    $res = $this->actingAs($user)->getJson('/api/v1/ceo/tokens');

    $res->assertStatus(403);
});
