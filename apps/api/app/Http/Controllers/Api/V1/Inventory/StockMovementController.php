<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Actions\AdjustStockAction;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Inventory\StockAdjustmentRequest;
use App\Http\Resources\V1\Inventory\StockMovementResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockMovementController extends Controller
{
    /** List movements for a given ingredient (paginated, newest first). */
    public function index(Request $request, Ingredient $ingredient): AnonymousResourceCollection
    {
        $perPage = min((int) $request->integer('per_page', 30), 200);

        $query = StockMovement::query()
            ->where('ingredient_id', $ingredient->id)
            ->orderBy('recorded_at', 'desc');

        if ($request->filled('reason')) {
            $query->where('reason', $request->string('reason'));
        }

        return StockMovementResource::collection($query->paginate($perPage));
    }

    /** Manual stock adjustment for a specific ingredient. */
    public function store(
        StockAdjustmentRequest $request,
        Ingredient $ingredient,
        AdjustStockAction $adjust,
    ): JsonResponse {
        $user = $request->user();

        $movement = $adjust([
            'ingredient_id' => $ingredient->id,
            'delta' => $request->validated('delta'),
            'reason' => $request->validated('reason'),
            'reference_type' => $request->validated('reference_type'),
            'reference_id' => $request->validated('reference_id'),
            'cost_per_unit' => $request->validated('cost_per_unit'),
            'notes' => $request->validated('notes'),
            'created_by' => $user?->uuid,
        ]);

        return response()->json(
            ['data' => StockMovementResource::make($movement)],
            201,
        );
    }
}
