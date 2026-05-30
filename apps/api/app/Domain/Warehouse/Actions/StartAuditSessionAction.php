<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Warehouse\Enums\AuditStatus;
use App\Domain\Warehouse\Models\AuditSession;
use App\Domain\Warehouse\Models\AuditSessionItem;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Support\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Opens an inventory-audit (inventarizatsiya) session. Snapshots the current
 * stock for every ingredient that belongs to the target warehouse (or every
 * tenant ingredient with no warehouse pinned, since we accept null = legacy
 * default warehouse). The snapshot lives in audit_session_items.expected_quantity
 * and is used at completion time to compute the discrepancy.
 */
class StartAuditSessionAction
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   warehouse_id: string,
     *   conducted_by?: int|null,
     *   notes?: string|null,
     * } $input
     */
    public function __invoke(array $input): AuditSession
    {
        return DB::transaction(function () use ($input): AuditSession {
            /** @var Warehouse $warehouse */
            $warehouse = Warehouse::query()->findOrFail($input['warehouse_id']);

            $tenantId = $input['tenant_id'] ?? $warehouse->tenant_id;
            $startedAt = now();
            $docNo = DocumentNumberGenerator::generate(
                AuditSession::class,
                'AUD',
                $tenantId,
                $startedAt,
            );

            /** @var AuditSession $session */
            $session = AuditSession::create([
                'tenant_id' => $tenantId,
                'warehouse_id' => $warehouse->id,
                'doc_no' => $docNo,
                'started_at' => $startedAt,
                'conducted_by' => $input['conducted_by'] ?? null,
                'status' => AuditStatus::InProgress->value,
                'discrepancy_count' => 0,
                'notes' => $input['notes'] ?? null,
            ]);

            // Snapshot every active ingredient in the warehouse (or tenant-wide
            // when warehouse_id matches the tenant's default warehouse and
            // legacy null-warehouse rows still exist).
            $ingredients = Ingredient::query()
                ->where('tenant_id', $tenantId)
                ->where(function ($q) use ($warehouse): void {
                    $q->where('warehouse_id', $warehouse->id);
                    if ($warehouse->is_default) {
                        $q->orWhereNull('warehouse_id');
                    }
                })
                ->where('is_active', true)
                ->get();

            foreach ($ingredients as $ingredient) {
                AuditSessionItem::create([
                    'audit_session_id' => $session->id,
                    'ingredient_id' => $ingredient->id,
                    'expected_quantity' => (float) $ingredient->current_stock,
                    'actual_quantity' => null,
                    'discrepancy' => 0,
                ]);
            }

            $reloaded = $session->fresh(['items', 'warehouse']);
            assert($reloaded instanceof AuditSession);

            return $reloaded;
        });
    }
}
