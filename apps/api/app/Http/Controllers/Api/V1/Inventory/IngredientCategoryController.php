<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Models\IngredientCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IngredientCategoryController extends Controller
{
    public function index(): JsonResource
    {
        $categories = IngredientCategory::query()
            ->withCount('ingredients')
            ->orderBy('sort_order')
            ->get();

        return JsonResource::collection($categories);
    }

    public function store(Request $request): JsonResource
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.uz' => ['required', 'string', 'max:120'],
            'name.ru' => ['nullable', 'string', 'max:120'],
            'name.en' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = IngredientCategory::create([
            'tenant_id' => app('tenant.id'),
            'name' => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return new JsonResource($category);
    }

    public function update(Request $request, IngredientCategory $ingredientCategory): JsonResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'array'],
            'name.uz' => ['sometimes', 'string', 'max:120'],
            'name.ru' => ['sometimes', 'nullable', 'string', 'max:120'],
            'name.en' => ['sometimes', 'nullable', 'string', 'max:120'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $ingredientCategory->update($data);

        return new JsonResource($ingredientCategory->fresh());
    }

    public function destroy(IngredientCategory $ingredientCategory): JsonResponse
    {
        $ingredientCategory->delete();

        return response()->json(['data' => ['message' => 'deleted']]);
    }
}
