<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Menu;

use App\Domain\Menu\Models\MenuCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Menu\StoreMenuCategoryRequest;
use App\Http\Requests\V1\Menu\UpdateMenuCategoryRequest;
use App\Http\Resources\V1\Menu\MenuCategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class MenuCategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MenuCategory::query()
            ->withCount('items')
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return MenuCategoryResource::collection($query->get());
    }

    public function show(MenuCategory $category): MenuCategoryResource
    {
        return MenuCategoryResource::make($category->loadCount('items'));
    }

    public function store(StoreMenuCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['uz'] ?? $data['name']['en']) . '-' . Str::random(4);
        }

        $category = MenuCategory::create($data);

        return response()->json(
            ['data' => MenuCategoryResource::make($category)],
            201,
        );
    }

    public function update(UpdateMenuCategoryRequest $request, MenuCategory $category): MenuCategoryResource
    {
        $category->update($request->validated());

        return MenuCategoryResource::make($category->fresh());
    }

    public function destroy(MenuCategory $category): JsonResponse
    {
        $category->delete();

        return response()->json(['data' => ['message' => "Kategoriya o'chirildi"]]);
    }
}
