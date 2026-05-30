<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\AuditStatus;
use App\Domain\Warehouse\Models\AuditSession;
use App\Domain\Warehouse\Models\AuditSessionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Finalises an inventory audit. For every item with a non-zero discrepancy
 * (actual - expected) we create a single StockMovement of reason=adjust and
 * fix the ingredient's current_stock to match the actual count. The session
 * is then closed (status=completed, completed_at=now).
 *
 * NB: `actual_quantity` is recorded earlier via the controller's update()
 * endpoint — this action only consumes the rows already on disk.
 */
class CompleteAuditSessionAction
{
    public function __invoke(AuditSession $session, ?int $userId = null): AuditSession
    {
        if ($session->statusEnum() === AuditStatus::Completed) {
            throw ValidationException::withMessages([
                'status' => ['Inventarizatsiya allaqachon yakunlangan.'],
            ]);
        }

        return DB::transaction(function () use ($session, $userId): AuditSession {
            // Lock the session row to prevent two concurrent `complete` calls
            // from each producing duplicate stock movements. (code review)
            /** @var AuditSession $locked */
            $locked = AuditSession::query()
                ->lockForUpdate()
                ->findOrFail($session->id);

            if ($locked->statusEnum() === AuditStatus::Completed) {
                throw ValidationException::withMessages([
                    'status' => ['Inventarizatsiya allaqachon yakunlangan.'],
                ]);
            }

            $session = $locked;
            $session->load('items');

            $discrepancyCount = 0;

            /** @var iterable<AuditSessionItem> $items */
            $items = $session->items;
            foreach ($items as $item) {
                // Items the auditor never touched count as "no actual data" —
                // skip the adjustment but don't fail; the dashboard surfaces
                // the missing rows via the discrepancy_count UI.
                if ($item->actual_quantity === null) {
                    continue;
                }

                $expected = (float) $item->expected_quantity;
                $actual = (float) $item->actual_quantity;
                $delta = $actual - $expected;

                // Persist the discrepancy on the item regardless — useful for
                // reports even when the value is 0.
                $item->update(['discrepancy' => $delta]);

                if ($delta === 0.0) {
                    continue;
                }

                $discrepancyCount++;

                /** @var Ingredient $ingredient */
                $ingredient = Ingredient::query()
                    ->lockForUpdate()
                    ->findOrFail($item->ingredient_id);

                $ingredient->update(['current_stock' => $actual]);

                StockMovement::create([
                    'tenant_id' => $session->tenant_id,
                    'ingredient_id' => $ingredient->id,
                    'delta' => $delta,
                    'balance_after' => $actual,
                    'reason' => StockMovementReason::Adjustment->value,
                    'reference_type' => 'audit_session',
                    'reference_id' => $session->id,
                    'cost_per_unit' => null,
                    'notes' => "Inventarizatsiya: {$session->doc_no}",
                    'recorded_at' => now(),
                    'created_by' => $userId !== null ? (string) $userId : null,
                    'created_at' => now(),
                ]);
            }

            $session->update([
                'status' => AuditStatus::Completed->value,
                'completed_at' => now(),
                'discrepancy_count' => $discrepancyCount,
            ]);

            $reloaded = $session->fresh(['items', 'warehouse']);
            assert($reloaded instanceof AuditSession);

            return $reloaded;
        });
    }
}
