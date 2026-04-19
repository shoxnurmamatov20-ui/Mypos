<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Table;

use App\Domain\Table\Models\TableCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Table\StoreTableCategoryRequest;
use App\Http\Resources\V1\Table\TableCategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class TableCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TableCategoryResource::collection(
            TableCategory::query()
                ->withCount('tables')
                ->orderBy('sort_order')
                ->get(),
        );
    }

    public function store(StoreTableCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['uz'] ?? $data['name']['en']) . '-' . Str::random(4);
        }
        $category = TableCategory::create($data);

        return response()->json(
            ['data' => TableCategoryResource::make($category)],
            201,
        );
    }

    public function update(StoreTableCategoryRequest $request, TableCategory $tableCategory): TableCategoryResource
    {
        $tableCategory->update($request->validated());

        return TableCategoryResource::make($tableCategory->fresh());
    }

    public function destroy(TableCategory $tableCategory): JsonResponse
    {
        $tableCategory->delete();

        return response()->json(['data' => ['message' => "Kategoriya o'chirildi"]]);
    }
}
