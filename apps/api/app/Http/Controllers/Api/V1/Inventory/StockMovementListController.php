<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Inventory\StockMovementResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Flat / cross-ingredient stock-movement listing.
 *
 * The legacy {@see StockMovementController::index} requires an ingredient_id
 * and returns movements for that one ingredient. The manager-panel
 * Tovarlar sarfi (consumption) page needs the OPPOSITE: every movement
 * across every ingredient, paginated, filterable by reason / date range /
 * ingredient — with the ingredient eager-loaded so the table can render
 * names without N+1.
 *
 * Endpoint: GET /api/v1/inventory/movements
 */
class StockMovementListController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', StockMovement::class);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:64'],
            'ingredient_id' => ['nullable', 'uuid'],
            'reference_type' => ['nullable', 'string', 'max:64'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'sort' => ['nullable', Rule::in(['recorded_at', '-recorded_at', 'created_at', '-created_at'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 30);
        $sort = (string) ($validated['sort'] ?? '-recorded_at');

        $query = StockMovement::query()
            // Eager-load only the columns we need for the table — keeps the
            // JSON payload tight even at per_page=200.
            ->with(['ingredient' => function ($q): void {
                $q->select(['id', 'tenant_id', 'name', 'unit', 'cost_per_unit', 'sku']);
            }]);

        if (! empty($validated['reason'])) {
            $query->where('reason', $validated['reason']);
        }
        if (! empty($validated['ingredient_id'])) {
            $query->where('ingredient_id', $validated['ingredient_id']);
        }
        if (! empty($validated['reference_type'])) {
            $query->where('reference_type', $validated['reference_type']);
        }
        if (! empty($validated['date_from'])) {
            $query->where('recorded_at', '>=', $validated['date_from'].' 00:00:00');
        }
        if (! empty($validated['date_to'])) {
            $query->where('recorded_at', '<=', $validated['date_to'].' 23:59:59');
        }

        // Sort direction: prefix '-' means desc.
        $col = ltrim($sort, '-');
        $dir = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $query->orderBy($col, $dir);

        return StockMovementResource::collection($query->paginate($perPage));
    }

    /**
     * Aggregated consumption stats for the manager dashboard.
     * Endpoint: GET /api/v1/inventory/movements/stats
     *
     * Returns: today/week/month totals (quantity + cost in minor units) for
     * the given reason filter (default 'order_consume').
     */
    public function stats(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:64'],
            'ingredient_id' => ['nullable', 'uuid'],
        ]);
        $reason = (string) ($validated['reason'] ?? 'order_consume');

        $base = StockMovement::query()->where('reason', $reason);
        if (! empty($validated['ingredient_id'])) {
            $base->where('ingredient_id', $validated['ingredient_id']);
        }

        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        $aggregate = function ($from) use ($base) {
            return (clone $base)
                ->where('recorded_at', '>=', $from)
                ->leftJoin('ingredients', 'ingredients.id', '=', 'stock_movements.ingredient_id')
                ->selectRaw('
                    COALESCE(SUM(ABS(stock_movements.delta)), 0) AS qty_total,
                    COALESCE(SUM(ABS(stock_movements.delta) * COALESCE(stock_movements.cost_per_unit, ingredients.cost_per_unit, 0)), 0) AS cost_total,
                    COUNT(*) AS movement_count
                ')
                ->first();
        };

        $todayAgg = $aggregate($today);
        $weekAgg = $aggregate($weekStart);
        $monthAgg = $aggregate($monthStart);

        // Top consumed ingredient this month
        $top = (clone $base)
            ->where('recorded_at', '>=', $monthStart)
            ->leftJoin('ingredients', 'ingredients.id', '=', 'stock_movements.ingredient_id')
            ->selectRaw('
                stock_movements.ingredient_id,
                ingredients.name AS ingredient_name,
                ingredients.unit AS ingredient_unit,
                SUM(ABS(stock_movements.delta)) AS qty_total
            ')
            ->groupBy('stock_movements.ingredient_id', 'ingredients.name', 'ingredients.unit')
            ->orderByDesc('qty_total')
            ->limit(1)
            ->first();

        $topIngredient = null;
        if ($top !== null) {
            $rawName = $top->ingredient_name ?? null;
            $name = is_string($rawName) ? (json_decode($rawName, true) ?? $rawName) : $rawName;
            $topIngredient = [
                'id' => $top->ingredient_id,
                'name' => $name,
                'unit' => $top->ingredient_unit ?? null,
                'quantity' => (float) $top->qty_total,
            ];
        }

        return response()->json([
            'data' => [
                'reason' => $reason,
                'today' => [
                    'quantity' => (float) ($todayAgg->qty_total ?? 0),
                    'cost' => (int) ($todayAgg->cost_total ?? 0),
                    'movements' => (int) ($todayAgg->movement_count ?? 0),
                ],
                'week' => [
                    'quantity' => (float) ($weekAgg->qty_total ?? 0),
                    'cost' => (int) ($weekAgg->cost_total ?? 0),
                    'movements' => (int) ($weekAgg->movement_count ?? 0),
                ],
                'month' => [
                    'quantity' => (float) ($monthAgg->qty_total ?? 0),
                    'cost' => (int) ($monthAgg->cost_total ?? 0),
                    'movements' => (int) ($monthAgg->movement_count ?? 0),
                ],
                'top_ingredient' => $topIngredient,
            ],
        ]);
    }
}
