<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

it('returns 403 for non-super-admin', function (): void {
    $user = actingAsTenantOwner();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/super-admin/dashboard')->assertStatus(403);
});

it('returns aggregated KPIs across all tenants', function (): void {
    Tenant::factory()->count(3)->create([
        'subscription_status' => 'active',
        'subscription_plan' => 'pro',
        'mrr_minor' => 250_000,
    ]);
    Tenant::factory()->count(2)->create([
        'subscription_status' => 'trialing',
        'subscription_plan' => 'starter',
        'mrr_minor' => 0,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/dashboard')->assertOk();

    expect($response->json('data.tenants.total'))->toBeGreaterThanOrEqual(5);
    expect($response->json('data.tenants.active'))->toBeGreaterThanOrEqual(3);
    expect($response->json('data.tenants.trialing'))->toBeGreaterThanOrEqual(2);

    expect($response->json('data.revenue.mrr_total_minor'))->toBeGreaterThanOrEqual(750_000);
    expect($response->json('data.revenue.arr_total_minor'))->toBe(
        $response->json('data.revenue.mrr_total_minor') * 12,
    );

    expect($response->json('data.system.uptime_percent'))->toBeFloat();
});

it('returns chart series for the requested range', function (): void {
    $tenant = Tenant::factory()->create(['subscription_status' => 'active']);
    Order::factory()->count(3)->create([
        'tenant_id' => $tenant->id,
        'status' => 'completed',
        'total_amount' => 50_000,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/dashboard/charts?range=7d')
        ->assertOk()
        ->assertJsonPath('meta.range', '7d');

    expect($response->json('data.revenue_by_day'))->toBeArray()->toHaveCount(7);
    expect($response->json('data.signups_by_day'))->toBeArray()->toHaveCount(7);
    expect($response->json('data.orders_by_day'))->toBeArray()->toHaveCount(7);
    expect($response->json('data.tenants_by_plan'))->toBeArray();
});

it('falls back to 30d for invalid range', function (): void {
    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/dashboard/charts?range=invalid')
        ->assertOk()
        ->assertJsonPath('meta.range', '30d');

    expect($response->json('data.revenue_by_day'))->toHaveCount(30);
});
