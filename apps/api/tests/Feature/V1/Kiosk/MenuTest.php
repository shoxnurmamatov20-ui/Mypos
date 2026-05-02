<?php

declare(strict_types=1);

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Cache;

beforeEach(function (): void {
    Cache::flush();
});

it('returns the active menu for the kiosk\'s tenant', function (): void {
    $tenant = Tenant::factory()->create();
    $category = MenuCategory::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => true,
    ]);
    $item = MenuItem::factory()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenant->id]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->getJson('/api/v1/kiosk/menu')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'tenant' => ['id', 'slug', 'name'],
                'categories',
                'items',
            ],
        ]);

    expect($response->json('data.tenant.id'))->toBe($tenant->id);
    expect($response->json('data.categories'))->toHaveCount(1);
    expect($response->json('data.items'))->toHaveCount(1);
    expect($response->json('data.items.0.id'))->toBe($item->id);
});

it('does not leak menu items from other tenants', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $catA = MenuCategory::factory()->create(['tenant_id' => $tenantA->id, 'is_active' => true]);
    MenuItem::factory()->create(['tenant_id' => $tenantA->id, 'category_id' => $catA->id, 'is_active' => true]);

    $catB = MenuCategory::factory()->create(['tenant_id' => $tenantB->id, 'is_active' => true]);
    MenuItem::factory()->create(['tenant_id' => $tenantB->id, 'category_id' => $catB->id, 'is_active' => true]);

    $paired = KioskDevice::factory()->createWithToken(['tenant_id' => $tenantA->id]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $paired['token'])
        ->getJson('/api/v1/kiosk/menu')
        ->assertOk();

    expect($response->json('data.items'))->toHaveCount(1);
});

it('requires a device token', function (): void {
    $this->getJson('/api/v1/kiosk/menu')->assertStatus(401);
});
