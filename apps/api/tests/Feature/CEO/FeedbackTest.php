<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as MyposRole;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Models\OrderReview;
use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * CEO guest-feedback surface (/api/v1/ceo/feedback*).
 *
 * Tenant isolation is the load-bearing invariant: a CEO must only ever see
 * reviews belonging to tenants they own via the tenant_owners pivot.
 */
function makeCeoForFeedback(Tenant $owns): User
{
    SpatieRole::findOrCreate(MyposRole::Ceo->value, 'web');

    $user = User::factory()->create([
        'tenant_id' => null,
        'is_super_admin' => false,
    ]);
    $user->assignRole(MyposRole::Ceo->value);
    $user->ownedTenants()->attach($owns->id, [
        'id' => (string) Str::uuid(),
        'is_primary' => true,
        'joined_at' => now(),
    ]);

    return $user;
}

function makeReview(Tenant $tenant, array $overrides = []): OrderReview
{
    $order = Order::factory()->forTenant($tenant)->paid()->create();

    return OrderReview::query()->create(array_merge([
        'tenant_id' => $tenant->id,
        'order_id' => $order->id,
        'rating' => 5,
        'comment' => 'Juda mazali!',
    ], $overrides));
}

it('lists reviews scoped to owned tenants with pagination meta', function (): void {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($owned);

    makeReview($owned);
    makeReview($owned, ['rating' => 2, 'comment' => null]);
    makeReview($other); // foreign — must NOT leak

    $res = $this->actingAs($ceo)->getJson('/api/v1/ceo/feedback');

    $res->assertOk();
    $res->assertJsonCount(2, 'data');
    $res->assertJsonPath('meta.total', 2);
    $res->assertJsonPath('meta.page', 1);
});

it('filters by rating and has_comment', function (): void {
    $tenant = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($tenant);

    makeReview($tenant, ['rating' => 5, 'comment' => 'Zo\'r']);
    makeReview($tenant, ['rating' => 2, 'comment' => null]);

    $this->actingAs($ceo)->getJson('/api/v1/ceo/feedback?rating=5')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->actingAs($ceo)->getJson('/api/v1/ceo/feedback?has_comment=0')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.rating', 2);
});

it('computes stats with rating distribution', function (): void {
    $tenant = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($tenant);

    makeReview($tenant, ['rating' => 5]);
    makeReview($tenant, ['rating' => 5]);
    makeReview($tenant, ['rating' => 1, 'comment' => 'Yomon']);

    $res = $this->actingAs($ceo)->getJson('/api/v1/ceo/feedback/stats');

    $res->assertOk();
    $res->assertJsonPath('data.total', 3);
    $res->assertJsonPath('data.positive_count', 2);
    $res->assertJsonPath('data.negative_count', 1);
    expect($res->json('data.avg_rating'))->toEqual(3.67);

    $five = collect($res->json('data.distribution'))->firstWhere('rating', 5);
    expect($five['count'])->toBe(2);
});

it('shows a single review with customer and order context', function (): void {
    $tenant = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($tenant);

    $customer = Customer::factory()->forTenant($tenant)->create([
        'first_name' => 'Anvar',
        'last_name' => 'Karimov',
    ]);
    $review = makeReview($tenant, ['customer_id' => $customer->id, 'food_rating' => 4]);

    $res = $this->actingAs($ceo)->getJson("/api/v1/ceo/feedback/{$review->id}");

    $res->assertOk();
    $res->assertJsonPath('data.id', $review->id);
    $res->assertJsonPath('data.food_rating', 4);
    $res->assertJsonPath('data.customer.name', 'Anvar Karimov');
    expect($res->json('data.order.order_no'))->not->toBeNull();
});

it('refuses to show or delete a foreign tenant review (404)', function (): void {
    $owned = Tenant::factory()->create();
    $other = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($owned);

    $foreign = makeReview($other);

    $this->actingAs($ceo)->getJson("/api/v1/ceo/feedback/{$foreign->id}")->assertNotFound();
    $this->actingAs($ceo)->deleteJson("/api/v1/ceo/feedback/{$foreign->id}")->assertNotFound();
    expect(OrderReview::query()->withoutGlobalScopes()->find($foreign->id))->not->toBeNull();
});

it('deletes an owned review', function (): void {
    $tenant = Tenant::factory()->create();
    $ceo = makeCeoForFeedback($tenant);
    $review = makeReview($tenant);

    $this->actingAs($ceo)->deleteJson("/api/v1/ceo/feedback/{$review->id}")
        ->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(OrderReview::query()->withoutGlobalScopes()->find($review->id))->toBeNull();
});

it('lists owned restaurants as filter options', function (): void {
    $owned = Tenant::factory()->create();
    Tenant::factory()->create(); // foreign
    $ceo = makeCeoForFeedback($owned);

    $res = $this->actingAs($ceo)->getJson('/api/v1/ceo/feedback/restaurants');

    $res->assertOk();
    $res->assertJsonCount(1, 'data');
    $res->assertJsonPath('data.0.id', $owned->id);
});

it('denies non-CEO users', function (): void {
    SpatieRole::findOrCreate(MyposRole::Cashier->value, 'web');
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $user->assignRole(MyposRole::Cashier->value);

    $this->actingAs($user)->getJson('/api/v1/ceo/feedback')->assertStatus(403);
});
