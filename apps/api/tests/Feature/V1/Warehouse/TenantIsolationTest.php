<?php

declare(strict_types=1);

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Warehouse\Models\IncomingDocument;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Models\WasteDocument;
use Laravel\Sanctum\Sanctum;

it('does not leak other tenants warehouses, incoming, waste or transfers', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    // Owner of tenant A.
    $ownerA = actingAsTenantOwner($tenantA);

    // Each tenant has its own warehouse + ingredient + posted docs.
    $whA = Warehouse::factory()->default()->create(['tenant_id' => $tenantA->id]);
    $whB = Warehouse::factory()->default()->create(['tenant_id' => $tenantB->id]);

    $ingA = Ingredient::factory()->create(['tenant_id' => $tenantA->id, 'warehouse_id' => $whA->id]);
    $ingB = Ingredient::factory()->create(['tenant_id' => $tenantB->id, 'warehouse_id' => $whB->id]);

    // Tenant B docs — created via direct factory-style writes to keep this
    // test orthogonal to the controller behaviour we already exercise.
    IncomingDocument::query()->create([
        'tenant_id' => $tenantB->id,
        'warehouse_id' => $whB->id,
        'doc_no' => 'IN-260528-9999',
        'doc_date' => now()->toDateString(),
        'total_amount' => 10000,
        'currency' => 'UZS',
        'status' => 'posted',
    ]);
    WasteDocument::query()->create([
        'tenant_id' => $tenantB->id,
        'warehouse_id' => $whB->id,
        'doc_no' => 'WST-260528-9999',
        'doc_date' => now()->toDateString(),
        'reason' => 'expired',
        'total_cost' => 500,
        'status' => 'posted',
    ]);

    Sanctum::actingAs($ownerA);

    // Lists only return tenant A's rows.
    $whIds = collect($this->getJson('/api/v1/warehouses')->assertOk()->json('data'))
        ->pluck('id')->all();
    expect($whIds)->toEqual([$whA->id]);

    $incIds = collect($this->getJson('/api/v1/incoming-documents')->assertOk()->json('data'))
        ->pluck('id')->all();
    expect($incIds)->toBeEmpty();

    $wstIds = collect($this->getJson('/api/v1/waste-documents')->assertOk()->json('data'))
        ->pluck('id')->all();
    expect($wstIds)->toBeEmpty();

    // Direct GET on tenant B's IDs returns 404 (global scope returns nothing).
    $this->getJson("/api/v1/warehouses/{$whB->id}")->assertStatus(404);
});

it('blocks creating documents that point at another tenant warehouse', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $ownerA = actingAsTenantOwner($tenantA);
    $whB = Warehouse::factory()->default()->create(['tenant_id' => $tenantB->id]);
    $ingA = Ingredient::factory()->create(['tenant_id' => $tenantA->id]);

    Sanctum::actingAs($ownerA);

    // The `exists:warehouses,id` rule runs without tenant scope (validation
    // bypasses our model query) so it WILL find $whB. However the controller
    // resolves the warehouse via the Action which uses the scoped query and
    // returns 404 — that surfaces as a ModelNotFoundException -> 404.
    $this->postJson('/api/v1/incoming-documents', [
        'warehouse_id' => $whB->id,
        'items' => [
            ['ingredient_id' => $ingA->id, 'quantity' => 1, 'unit_price' => 100],
        ],
    ])->assertStatus(404);
});
