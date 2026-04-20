<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Actions\LowStockReportAction;
use App\Domain\Inventory\Models\Ingredient;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\JsonResponse;

class InventoryReportController extends Controller
{
    public function lowStock(LowStockReportAction $report): JsonResponse
    {
        $items = $report();

        return response()->json([
            'data' => IngredientResource::collection($items),
            'meta' => [
                'count' => $items->count(),
            ],
        ]);
    }

    /**
     * Total value of on-hand stock = sum(current_stock * cost_per_unit) per ingredient.
     */
    public function valuation(): JsonResponse
    {
        $ingredients = Ingredient::query()
            ->with('category')
            ->where('is_active', true)
            ->get();

        $totalValue = 0;
        $rows = [];

        foreach ($ingredients as $ing) {
            $value = (int) round((float) $ing->current_stock * $ing->cost_per_unit);
            $totalValue += $value;
            $rows[] = [
                'ingredient_id' => $ing->id,
                'name' => $ing->name,
                'unit' => $ing->unit,
                'current_stock' => (float) $ing->current_stock,
                'cost_per_unit' => $ing->cost_per_unit,
                'value' => $value,
            ];
        }

        usort($rows, fn ($a, $b) => $b['value'] <=> $a['value']);

        return response()->json([
            'data' => [
                'items' => $rows,
                'total_value' => $totalValue,
                'currency' => 'UZS',
            ],
        ]);
    }
}
