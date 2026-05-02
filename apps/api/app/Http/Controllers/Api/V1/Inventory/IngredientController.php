<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Actions\CreateIngredientAction;
use App\Domain\Inventory\Models\Ingredient;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Inventory\StoreIngredientRequest;
use App\Http\Requests\V1\Inventory\UpdateIngredientRequest;
use App\Http\Resources\V1\Inventory\IngredientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IngredientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ingredient::class);

        $query = Ingredient::query()
            ->with('category')
            ->orderBy('name->uz');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->string('category_id'));
        }
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }
        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('name->uz', 'ilike', "%{$search}%")
                    ->orWhere('name->ru', 'ilike', "%{$search}%")
                    ->orWhere('name->en', 'ilike', "%{$search}%")
                    ->orWhere('sku', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return IngredientResource::collection($query->paginate($perPage));
    }

    public function show(Ingredient $ingredient): IngredientResource
    {
        $this->authorize('view', $ingredient);

        return IngredientResource::make($ingredient->load('category'));
    }

    public function store(
        StoreIngredientRequest $request,
        CreateIngredientAction $create,
    ): JsonResponse {
        $this->authorize('create', Ingredient::class);

        $data = $request->validated();
        $user = $request->user();
        $data['created_by'] = $user?->uuid;

        $ingredient = $create($data);

        return response()->json(
            ['data' => IngredientResource::make($ingredient->load('category'))],
            201,
        );
    }

    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): IngredientResource
    {
        $this->authorize('update', $ingredient);

        $ingredient->update($request->validated());

        return IngredientResource::make($ingredient->fresh()->load('category'));
    }

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $this->authorize('delete', $ingredient);

        $ingredient->delete();

        return response()->json(['data' => ['message' => "Ingredient o'chirildi"]]);
    }
}
