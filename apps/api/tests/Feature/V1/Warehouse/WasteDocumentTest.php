<?php

declare(strict_types=1);

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\WasteReason;
use App\Domain\Warehouse\Enums\WasteStatus;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Models\WasteDocument;
use Laravel\Sanctum\Sanctum;

it('rejects unauthenticated access', function (): void {
    $this->getJson('/api/v1/waste-documents')->assertStatus(401);
});

it('creates a waste document and decrements stock', function (): void {
    $owner = actingAsTenantOwner();
    $tenantId = $owner->tenant_id;
    $warehouse = Warehouse::factory()->default()->create(['tenant_id' => $tenantId]);

    $ingredients = Ingredient::factory()->count(2)->create([
        'tenant_id' => $tenantId,
        'current_stock' => 50,
        'cost_per_unit' => 10000,
    ]);

    Sanctum::actingAs($owner);

    $payload = [
        'warehouse_id' => $warehouse->id,
        'reason' => WasteReason::Expired->value,
        'items' => [
            ['ingredient_id' => $ingredients[0]->id, 'quantity' => 5,  'unit_cost' => 10000],
            ['ingredient_id' => $ingredients[1]->id, 'quantity' => 3.5, 'unit_cost' => 10000],
        ],
    ];

    // 5 * 10000 + 3.5 * 10000 = 50000 + 35000 = 85000
    $expectedTotal = 85000;

    $response = $this->postJson('/api/v1/waste-documents', $payload)
        ->assertCreated()
        ->assertJsonPath('data.status', WasteStatus::Posted->value)
        ->assertJsonPath('data.total_cost', $expectedTotal)
        ->assertJsonPath('data.reason', WasteReason::Expired->value);

    $docNo = $response->json('data.doc_no');
    expect($docNo)->toMatch('/^WST-\d{6}-\d{4}$/');

    $document = WasteDocument::query()->where('doc_no', $docNo)->firstOrFail();
    expect($document->items()->count())->toBe(2);

    $movements = StockMovement::query()
        ->where('reference_type', 'waste_document')
        ->where('reference_id', $document->id)
        ->get();
    expect($movements)->toHaveCount(2);
    foreach ($movements as $mv) {
        expect($mv->reason)->toBe('waste');
        expect((float) $mv->delta)->toBeLessThan(0.0);
    }

    expect((float) $ingredients[0]->fresh()->current_stock)->toBe(45.0);
    expect((float) $ingredients[1]->fresh()->current_stock)->toBe(46.5);
});

it('falls back to ingredient cost_per_unit when unit_cost is missing', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'current_stock' => 20,
        'cost_per_unit' => 4000,
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/waste-documents', [
        'warehouse_id' => $warehouse->id,
        'reason' => WasteReason::Damaged->value,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 4],
        ],
    ])->assertCreated();

    // 4 * 4000 = 16000
    expect($response->json('data.total_cost'))->toBe(16000);
});

it('rejects unknown waste reason', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/waste-documents', [
        'warehouse_id' => $warehouse->id,
        'reason' => 'banana',
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1],
        ],
    ])->assertStatus(422)->assertJsonValidationErrors(['reason']);
});

it('does not move stock for a draft waste doc', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'current_stock' => 9,
    ]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/waste-documents', [
        'warehouse_id' => $warehouse->id,
        'reason' => WasteReason::Other->value,
        'status' => WasteStatus::Draft->value,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 4, 'unit_cost' => 100],
        ],
    ])->assertCreated();

    expect((float) $ingredient->fresh()->current_stock)->toBe(9.0);
});
