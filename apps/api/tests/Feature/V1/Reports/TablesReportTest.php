<?php

declare(strict_types=1);

use App\Domain\Order\Models\Order;
use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use Laravel\Sanctum\Sanctum;

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/v1/reports/tables')->assertStatus(401);
});

it('aggregates orders per table', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    $category = TableCategory::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'name' => ['uz' => 'Asosiy zal'],
    ]);
    $table = Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'category_id' => $category->id,
        'name' => 'Stol 1',
    ]);

    Order::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'table_id' => $table->id,
        'status' => 'completed',
        'total_amount' => 25_000,
        'guest_count' => 2,
    ]);

    $response = $this->getJson('/api/v1/reports/tables')->assertOk();

    $rows = $response->json('data');
    expect($rows)->toHaveCount(1);
    expect($rows[0]['name'])->toBe('Stol 1');
    expect($rows[0]['orders_count'])->toBe(3);
    expect($rows[0]['revenue_minor'])->toBe(75_000);
    expect($rows[0]['guests_total'])->toBe(6);
    expect($rows[0]['avg_ticket_minor'])->toBe(25_000);
});

it('excludes cancelled orders from per-table totals', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $table = Table::factory()->create(['tenant_id' => $owner->tenant_id]);

    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'table_id' => $table->id,
        'status' => 'completed',
        'total_amount' => 40_000,
    ]);
    Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'table_id' => $table->id,
        'status' => 'cancelled',
        'total_amount' => 999_999,
    ]);

    $response = $this->getJson('/api/v1/reports/tables')->assertOk();
    expect($response->json('data.0.orders_count'))->toBe(1);
    expect($response->json('data.0.revenue_minor'))->toBe(40_000);
});

it('returns meta with table totals', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    Table::factory()->count(3)->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'available',
    ]);
    Table::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'status' => 'maintenance',
    ]);

    $response = $this->getJson('/api/v1/reports/tables')->assertOk();
    expect($response->json('meta.total_tables'))->toBe(4);
    expect($response->json('meta.active_tables'))->toBe(3);
});
