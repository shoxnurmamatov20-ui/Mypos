<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Domain\Inventory\Models\Recipe;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Inventory\CreateRecipeRequest;
use App\Http\Resources\V1\Inventory\RecipeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecipeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Recipe::query()
            ->with('ingredient.category')
            ->orderBy('created_at', 'desc');

        if ($request->filled('menu_item_id')) {
            $query->where('menu_item_id', $request->string('menu_item_id'));
        }
        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->string('ingredient_id'));
        }

        return RecipeResource::collection($query->get());
    }

    public function store(CreateRecipeRequest $request): JsonResponse
    {
        $recipe = Recipe::create($request->validated());

        return response()->json(
            ['data' => RecipeResource::make($recipe->load('ingredient.category'))],
            201,
        );
    }

    public function destroy(Recipe $recipe): JsonResponse
    {
        $recipe->delete();

        return response()->json(['data' => ['message' => "Retsept o'chirildi"]]);
    }
}
