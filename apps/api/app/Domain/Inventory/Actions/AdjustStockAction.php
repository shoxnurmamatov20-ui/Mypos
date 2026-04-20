<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Atomically records a stock movement and updates the ingredient's current_stock.
 *
 * Delta is expressed in the ingredient's native unit:
 *   - positive: receive / purchase / adjust-up
 *   - negative: consume / waste / adjust-down
 */
class AdjustStockAction
{
    /**
     * @param array{
     *   ingredient_id: string,
     *   delta: float|int|string,
     *   reason: string,
     *   reference_type?: string|null,
     *   reference_id?: string|null,
     *   cost_per_unit?: int|null,
     *   notes?: string|null,
     *   recorded_at?: \DateTimeInterface|null,
     *   created_by?: string|null,
     * } $input
     */
    public function __invoke(array $input): StockMovement
    {
        $reasonEnum = StockMovementReason::tryFrom((string) $input['reason']);
        if ($reasonEnum === null) {
            throw ValidationException::withMessages([
                'reason' => ["Noto'g'ri sabab: {$input['reason']}"],
            ]);
        }

        $delta = (float) $input['delta'];
        if ($delta === 0.0) {
            throw ValidationException::withMessages([
                'delta' => ['O\'zgarish miqdori 0 bo\'lishi mumkin emas'],
            ]);
        }

        return DB::transaction(function () use ($input, $reasonEnum, $delta): StockMovement {
            /** @var Ingredient $ingredient */
            $ingredient = Ingredient::query()
                ->lockForUpdate()
                ->findOrFail($input['ingredient_id']);

            $newBalance = (float) $ingredient->current_stock + $delta;

            $ingredient->update(['current_stock' => $newBalance]);

            return StockMovement::create([
                'tenant_id' => $ingredient->tenant_id,
                'ingredient_id' => $ingredient->id,
                'delta' => $delta,
                'balance_after' => $newBalance,
                'reason' => $reasonEnum->value,
                'reference_type' => $input['reference_type'] ?? null,
                'reference_id' => $input['reference_id'] ?? null,
                'cost_per_unit' => $input['cost_per_unit'] ?? null,
                'notes' => $input['notes'] ?? null,
                'recorded_at' => $input['recorded_at'] ?? now(),
                'created_by' => $input['created_by'] ?? null,
                'created_at' => now(),
            ]);
        });
    }
}
