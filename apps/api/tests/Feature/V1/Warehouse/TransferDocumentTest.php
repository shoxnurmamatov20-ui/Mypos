<?php

declare(strict_types=1);

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\TransferStatus;
use App\Domain\Warehouse\Models\TransferDocument;
use App\Domain\Warehouse\Models\Warehouse;
use Laravel\Sanctum\Sanctum;

it('rejects unauthenticated access', function (): void {
    $this->getJson('/api/v1/transfer-documents')->assertStatus(401);
});

it('creates a transfer and records two stock movements per item', function (): void {
    $owner = actingAsTenantOwner();
    $tenantId = $owner->tenant_id;
    $from = Warehouse::factory()->default()->create(['tenant_id' => $tenantId]);
    $to = Warehouse::factory()->create(['tenant_id' => $tenantId]);

    $ingredient = Ingredient::factory()->create([
        'tenant_id' => $tenantId,
        'warehouse_id' => $from->id,
        'current_stock' => 50,
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/transfer-documents', [
        'from_warehouse_id' => $from->id,
        'to_warehouse_id' => $to->id,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 12],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('data.status', TransferStatus::Received->value);

    $docNo = $response->json('data.doc_no');
    expect($docNo)->toMatch('/^TRN-\d{6}-\d{4}$/');

    /** @var TransferDocument $doc */
    $doc = TransferDocument::query()->where('doc_no', $docNo)->firstOrFail();

    // Two movements: one OUT and one IN — the ingredient row is shared so
    // the net effect on current_stock is zero. See action class for details.
    $outMv = StockMovement::query()
        ->where('reference_type', 'transfer_document_out')
        ->where('reference_id', $doc->id)
        ->first();
    $inMv = StockMovement::query()
        ->where('reference_type', 'transfer_document_in')
        ->where('reference_id', $doc->id)
        ->first();

    expect($outMv)->not->toBeNull();
    expect($inMv)->not->toBeNull();
    expect((float) $outMv->delta)->toBe(-12.0);
    expect((float) $inMv->delta)->toBe(12.0);
});

it('refuses transfers from a warehouse to itself', function (): void {
    $owner = actingAsTenantOwner();
    $wh = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $this->postJson('/api/v1/transfer-documents', [
        'from_warehouse_id' => $wh->id,
        'to_warehouse_id' => $wh->id,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1],
        ],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['to_warehouse_id']);
});

it('does not move stock for a draft transfer', function (): void {
    $owner = actingAsTenantOwner();
    $from = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);
    $to = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $docId = $this->postJson('/api/v1/transfer-documents', [
        'from_warehouse_id' => $from->id,
        'to_warehouse_id' => $to->id,
        'status' => TransferStatus::Draft->value,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 3],
        ],
    ])->assertCreated()->json('data.id');

    expect(StockMovement::query()
        ->whereIn('reference_type', ['transfer_document_out', 'transfer_document_in'])
        ->where('reference_id', $docId)
        ->count())->toBe(0);
});

it('only deletes draft transfers', function (): void {
    $owner = actingAsTenantOwner();
    $from = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);
    $to = Warehouse::factory()->create(['tenant_id' => $owner->tenant_id]);
    $ingredient = Ingredient::factory()->create(['tenant_id' => $owner->tenant_id]);

    Sanctum::actingAs($owner);

    $posted = $this->postJson('/api/v1/transfer-documents', [
        'from_warehouse_id' => $from->id,
        'to_warehouse_id' => $to->id,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1],
        ],
    ])->assertCreated()->json('data.id');

    $this->deleteJson("/api/v1/transfer-documents/{$posted}")->assertStatus(403);

    $draft = $this->postJson('/api/v1/transfer-documents', [
        'from_warehouse_id' => $from->id,
        'to_warehouse_id' => $to->id,
        'status' => TransferStatus::Draft->value,
        'items' => [
            ['ingredient_id' => $ingredient->id, 'quantity' => 1],
        ],
    ])->assertCreated()->json('data.id');

    $this->deleteJson("/api/v1/transfer-documents/{$draft}")->assertOk();
});
