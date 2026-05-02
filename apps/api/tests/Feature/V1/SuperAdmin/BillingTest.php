<?php

declare(strict_types=1);

use App\Domain\Tenant\Models\Tenant;
use Laravel\Sanctum\Sanctum;

it('returns paginated subscriptions list', function (): void {
    Tenant::factory()->count(3)->create([
        'subscription_status' => 'active',
        'subscription_plan' => 'pro',
        'mrr_minor' => 250_000,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/billing/subscriptions?per_page=10')->assertOk();

    expect($response->json('data'))->toBeArray();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(3);
});

it('computes MRR breakdown by plan', function (): void {
    Tenant::factory()->count(2)->create([
        'subscription_status' => 'active',
        'subscription_plan' => 'pro',
        'mrr_minor' => 100_000,
    ]);
    Tenant::factory()->count(1)->create([
        'subscription_status' => 'active',
        'subscription_plan' => 'starter',
        'mrr_minor' => 50_000,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/billing/mrr-breakdown')->assertOk();

    $byPlan = collect($response->json('data.by_plan'))->keyBy('plan');

    expect($byPlan->get('pro'))->toMatchArray([
        'tenants' => 2,
        'mrr_minor' => 200_000,
    ]);
    expect($byPlan->get('starter'))->toMatchArray([
        'tenants' => 1,
        'mrr_minor' => 50_000,
    ]);

    expect($response->json('data.movement_30d'))->toHaveKeys([
        'new_mrr', 'expansion_mrr', 'churn_mrr', 'net',
    ]);
});

it('counts only paying tenants in subscriptions endpoint when filtered', function (): void {
    Tenant::factory()->count(2)->create([
        'subscription_status' => 'active',
        'subscription_plan' => 'pro',
        'mrr_minor' => 250_000,
    ]);
    Tenant::factory()->count(1)->create([
        'subscription_status' => 'cancelled',
        'subscription_plan' => 'pro',
        'mrr_minor' => 0,
    ]);

    $admin = actingAsSuperAdmin();
    Sanctum::actingAs($admin, ['super-admin']);

    $response = $this->getJson('/api/v1/super-admin/billing/subscriptions?status=active&plan=pro&per_page=10')
        ->assertOk();

    expect(count($response->json('data')))->toBe(2);
});
