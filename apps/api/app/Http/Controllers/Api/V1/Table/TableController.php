<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Table;

use App\Domain\Table\Enums\TableStatus;
use App\Domain\Table\Models\Table as TableModel;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Table\StoreTableRequest;
use App\Http\Requests\V1\Table\UpdateTableRequest;
use App\Http\Resources\V1\Table\TableResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TableModel::query()
            ->with('category')
            ->orderByRaw("CASE WHEN position_y IS NULL THEN 1 ELSE 0 END")
            ->orderBy('position_y')
            ->orderBy('position_x')
            ->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->string('category_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return TableResource::collection($query->get());
    }

    public function show(TableModel $table): TableResource
    {
        return TableResource::make($table->load('category'));
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = TableModel::create($request->validated());

        return response()->json(
            ['data' => TableResource::make($table->load('category'))],
            201,
        );
    }

    public function update(UpdateTableRequest $request, TableModel $table): TableResource
    {
        $table->update($request->validated());

        return TableResource::make($table->fresh()->load('category'));
    }

    public function updateStatus(Request $request, TableModel $table): TableResource
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(TableStatus::values())],
        ]);
        $table->update(['status' => $validated['status']]);

        return TableResource::make($table->fresh()->load('category'));
    }

    public function destroy(TableModel $table): JsonResponse
    {
        $table->delete();

        return response()->json(['data' => ['message' => "Stol o'chirildi"]]);
    }
}
