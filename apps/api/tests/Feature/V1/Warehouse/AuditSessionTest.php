<?php

declare(strict_types=1);

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\AuditStatus;
use App\Domain\Warehouse\Models\AuditSession;
use App\Domain\Warehouse\Models\AuditSessionItem;
use App\Domain\Warehouse\Models\Warehouse;
use Laravel\Sanctum\Sanctum;

it('rejects unauthenticated access', function (): void {
    $this->getJson('/api/v1/audit-sessions')->assertStatus(401);
});

it('starts a session and snapshots current_stock for every active ingredient', function (): void {
    $owner = actingAsTenantOwner();
    $tenantId = $owner->tenant_id;
    $warehouse = Warehouse::factory()->default()->create(['tenant_id' => $tenantId]);

    Ingredient::factory()->create([
        'tenant_id' => $tenantId,
        'warehouse_id' => $warehouse->id,
        'current_stock' => 12,
    ]);
    Ingredient::factory()->create([
        'tenant_id' => $tenantId,
        'warehouse_id' => $warehouse->id,
        'current_stock' => 3.5,
    ]);
    // Inactive ones must be excluded.
    Ingredient::factory()->create([
        'tenant_id' => $tenantId,
        'warehouse_id' => $warehouse->id,
        'is_active' => false,
        'current_stock' => 99,
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/audit-sessions', [
        'warehouse_id' => $warehouse->id,
        'notes' => 'Oylik inventarizatsiya',
    ])
        ->assertCreated()
        ->assertJsonPath('data.status', AuditStatus::InProgress->value);

    $sessionId = $response->json('data.id');
    expect($response->json('data.doc_no'))->toMatch('/^AUD-\d{6}-\d{4}$/');

    $items = AuditSessionItem::query()->where('audit_session_id', $sessionId)->get();
    expect($items)->toHaveCount(2);

    foreach ($items as $item) {
        expect((float) $item->expected_quantity)->toBeGreaterThan(0.0);
        expect($item->actual_quantity)->toBeNull();
    }
});

it('records actual quantities via update and computes discrepancies on complete', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);

    $ingA = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'warehouse_id' => $warehouse->id,
        'current_stock' => 20,
    ]);
    $ingB = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'warehouse_id' => $warehouse->id,
        'current_stock' => 10,
    ]);
    $ingC = Ingredient::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'warehouse_id' => $warehouse->id,
        'current_stock' => 5,
    ]);

    Sanctum::actingAs($owner);

    $sessionId = $this->postJson('/api/v1/audit-sessions', [
        'warehouse_id' => $warehouse->id,
    ])->assertCreated()->json('data.id');

    $itemA = AuditSessionItem::query()->where('audit_session_id', $sessionId)
        ->where('ingredient_id', $ingA->id)->firstOrFail();
    $itemB = AuditSessionItem::query()->where('audit_session_id', $sessionId)
        ->where('ingredient_id', $ingB->id)->firstOrFail();
    $itemC = AuditSessionItem::query()->where('audit_session_id', $sessionId)
        ->where('ingredient_id', $ingC->id)->firstOrFail();

    // Auditor: A short by 2 (expected 20, actual 18), B exact (no disc), C surplus of 1.
    $this->patchJson("/api/v1/audit-sessions/{$sessionId}", [
        'items' => [
            ['id' => $itemA->id, 'actual_quantity' => 18],
            ['id' => $itemB->id, 'actual_quantity' => 10],
            ['id' => $itemC->id, 'actual_quantity' => 6],
        ],
    ])->assertOk();

    // Complete the session.
    $this->postJson("/api/v1/audit-sessions/{$sessionId}/complete")->assertOk();

    /** @var AuditSession $session */
    $session = AuditSession::query()->find($sessionId);
    expect($session->status)->toBe(AuditStatus::Completed->value);
    expect($session->completed_at)->not->toBeNull();
    expect($session->discrepancy_count)->toBe(2);

    // Stock now matches actuals.
    expect((float) $ingA->fresh()->current_stock)->toBe(18.0);
    expect((float) $ingB->fresh()->current_stock)->toBe(10.0);
    expect((float) $ingC->fresh()->current_stock)->toBe(6.0);

    // Adjustment movements only for the two discrepant items.
    $adjustments = StockMovement::query()
        ->where('reference_type', 'audit_session')
        ->where('reference_id', $sessionId)
        ->get();
    expect($adjustments)->toHaveCount(2);
    foreach ($adjustments as $mv) {
        expect($mv->reason)->toBe('adjust');
    }
});

it('refuses to complete an already-completed session', function (): void {
    $owner = actingAsTenantOwner();
    $warehouse = Warehouse::factory()->default()->create(['tenant_id' => $owner->tenant_id]);
    Ingredient::factory()->count(1)->create([
        'tenant_id' => $owner->tenant_id,
        'warehouse_id' => $warehouse->id,
    ]);

    Sanctum::actingAs($owner);

    $sessionId = $this->postJson('/api/v1/audit-sessions', [
        'warehouse_id' => $warehouse->id,
    ])->assertCreated()->json('data.id');

    $this->postJson("/api/v1/audit-sessions/{$sessionId}/complete")->assertOk();
    // Second time around the policy `complete` returns false (status is no longer in_progress).
    $this->postJson("/api/v1/audit-sessions/{$sessionId}/complete")->assertStatus(403);
});
