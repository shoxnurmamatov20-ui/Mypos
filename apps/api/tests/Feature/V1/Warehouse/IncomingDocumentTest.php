<?php

declare(strict_types=1);

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\IncomingStatus;
use App\Domain\Warehouse\Models\IncomingDocument;
use App\Domain\Warehouse\Models\Warehouse;
use Laravel\Sanctum\Sanctum;

it('rejects unauthenticated access to incoming documents', function (): void {
    $this->getJson('/api/v1/incoming-documents')->assertStatus(401);
});

it('creates a posted incoming document with 3 items and increments stock', function (): void {
    $owner = actingAsTenantOwner();
    $tenantId = $owner->tenant_id;

    $warehouse = Warehouse::factory()->default()->create(['tenant_id' => $tenantId]);

    $ingredients = Ingredient::factory()->count(3)->create([
        'tenant_id' => $tenantId,
        'current_stock' => 0,
    ]);

    Sanctum::actingAs($owner);

    $payload = [
        'warehouse_id' => $warehouse->id,
        'doc_date' => now()->toDateString(),
        'supplier_name' => 'Yetkazib beruvchi MCHJ',
        'supplier_inn' => '301234567',
        'items' => [
            ['ingredient_id' => $ingredients[0]->id, 'quantity' => 10, 'unit_price' => 5000],
            ['ingredient_id' => $ingredients[1]->id, 'quantity' => 5,  'unit_price' => 12000],
            ['ingredient_id' => $ingredients[2]->id, 'quantity' => 3,  'unit_price' => 25000],
        ],
    ];

    // 10*5000 + 5*12000 + 3*25000 = 50000 + 60000 + 75000 = 185000
    $expectedTotal = 185000;

    $response = $this->postJson('/api/v1/incoming-documents', $payload)
        ->assertCreated()
        ->assertJsonPath('data.status', IncomingStatus::Posted->value)
        ->assertJsonPath('data.total_amount', $expectedTotal);

    $docNo = $response->json('data.doc_no');

    expect($docNo)->toMatch('/^IN-\d{6}-\d{4}$/');

    $this->assertDatabaseHas('incoming_documents', [
        'tenant_id' => $tenantId,
        'doc_no' => $docNo,
        'total_amount' => $expectedTotal,
        'warehouse_id' => $warehouse->id,
    ]);

    $document = IncomingDocument::query()->where('doc_no', $docNo)->firstOrFail();

    expect($document->items()->count())->toBe(3);

    // Verify stock_movements created with reason=purchase (the canonical
    // StockMovementReason mapping for incoming goods receipts).
    $movements = StockMovement::query()
        ->where('reference_type', 'incoming_document')
        ->where('reference_id', $document->id)
        ->get();

    expect($movements)->toHaveCount(3);
    foreach ($movements as $mv) {
        expect($mv->reason)->toBe('purchase');
    }

    // Each ingredient's current_stock matches the line quantity.
    expect((float) $ingredients[0]->fresh()->current_stock)->toBe(10.0);
    expect((float) $ingredients[1]->fresh()->current_stock)->toBe(5.0);
    expect((float) $ingredients[2]->fresh()->current_stock)->toBe(3.0);
});

it('rejects empty items array', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'items' => [],
    ])->assertStatus(422)->assertJsonValidationErrors(['items']);
});

it('rejects negative or zero quantities', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 0, 'unit_price' => 1000],
        ],
    ])->assertStatus(422)->assertJsonValidationErrors(['items.0.quantity']);
});

it('does not move stock for a draft document', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'current_stock' => 4,
    ]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'status' => 'draft',
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 7, 'unit_price' => 1000],
        ],
    ])->assertCreated();

    // Stock unchanged.
    expect((float) $ingredient->fresh()->current_stock)->toBe(4.0);
    expect(StockMovement::query()->where('reference_type', 'incoming_document')->count())->toBe(0);
});

it('lists documents with the items eager-loaded on show', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $created = $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 2, 'unit_price' => 500],
        ],
    ])->assertCreated();

    $id = $created->json('data.id');

    $this->getJson("/api/v1/incoming-documents/{$id}")
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'doc_no', 'items', 'warehouse']]);
});

it('only allows deleting draft documents', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $posted = $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'status' => 'posted',
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1, 'unit_price' => 100],
        ],
    ])->assertCreated()->json('data.id');

    $this->deleteJson("/api/v1/incoming-documents/{$posted}")
        ->assertStatus(403);

    $draft = $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $warehouse->id,
        'status' => 'draft',
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1, 'unit_price' => 100],
        ],
    ])->assertCreated()->json('data.id');

    $this->deleteJson("/api/v1/incoming-documents/{$draft}")->assertOk();
});

it('generates a sequential doc_no per tenant per day', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $docNos = [];
    for ($i = 0; $i < 3; $i++) {
        $docNos[] = $this->postJson('/api/v1/incoming-documents', [
            'warehouse_id' => $warehouse->id,
            'items' => [
                ['ingredient_id' => $ingredient->id, 'quantity' => 1, 'unit_price' => 100],
            ],
        ])->assertCreated()->json('data.doc_no');
    }

    $dateSegment = now()->format('ymd');
    expect($docNos[0])->toBe("IN-{$dateSegment}-0001");
    expect($docNos[1])->toBe("IN-{$dateSegment}-0002");
    expect($docNos[2])->toBe("IN-{$dateSegment}-0003");
});
