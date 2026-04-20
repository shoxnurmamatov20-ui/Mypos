<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Support\Facades\DB;

class CreateIngredientAction
{
    public function __construct(
        private readonly AdjustStockAction $adjustStock,
    ) {}

    /**
     * @param array{
     *   category_id?: string|null,
     *   name: array<string, string>,
     *   sku?: string|null,
     *   unit: string,
     *   cost_per_unit: int,
     *   current_stock?: float|int|string|null,
     *   min_stock?: float|int|string|null,
     *   reorder_point?: float|int|string|null,
     *   is_active?: bool,
     *   metadata?: array<string, mixed>|null,
     *   initial_stock?: float|int|string|null,
     *   created_by?: string|null,
     * } $input
     */
    public function __invoke(array $input): Ingredient
    {
        return DB::transaction(function () use ($input): Ingredient {
            $initialStock = isset($input['initial_stock'])
                ? (float) $input['initial_stock']
                : (float) ($input['current_stock'] ?? 0);

            $ingredient = Ingredient::create([
                'category_id' => $input['category_id'] ?? null,
                'name' => $input['name'],
                'sku' => $input['sku'] ?? null,
                'unit' => $input['unit'],
                'cost_per_unit' => (int) $input['cost_per_unit'],
                'current_stock' => 0, // will be set by adjustStock if needed
                'min_stock' => $input['min_stock'] ?? null,
                'reorder_point' => $input['reorder_point'] ?? null,
                'is_active' => $input['is_active'] ?? true,
                'metadata' => $input['metadata'] ?? null,
            ]);

            if ($initialStock > 0) {
                ($this->adjustStock)([
                    'ingredient_id' => $ingredient->id,
                    'delta' => $initialStock,
                    'reason' => StockMovementReason::Purchase->value,
                    'cost_per_unit' => (int) $input['cost_per_unit'],
                    'notes' => 'Boshlang\'ich qoldiq',
                    'created_by' => $input['created_by'] ?? null,
                ]);
                $ingredient->refresh();
            }

            return $ingredient;
        });
    }
}
