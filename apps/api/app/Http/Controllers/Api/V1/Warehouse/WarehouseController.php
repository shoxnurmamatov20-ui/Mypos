<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Warehouse;

use App\Domain\Warehouse\Actions\CreateWarehouseAction;
use App\Domain\Warehouse\Models\Warehouse;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreWarehouseRequest;
use App\Http\Requests\V1\Warehouse\UpdateWarehouseRequest;
use App\Http\Resources\V1\Warehouse\WarehouseResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Warehouse::class);

        $query = Warehouse::query()->orderBy('sort_order')->orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return WarehouseResource::collection($query->paginate($perPage));
    }

    public function show(Warehouse $warehouse): WarehouseResource
    {
        $this->authorize('view', $warehouse);

        return WarehouseResource::make($warehouse);
    }

    public function store(
        StoreWarehouseRequest $request,
        CreateWarehouseAction $create,
    ): JsonResponse {
        $this->authorize('create', Warehouse::class);

        $warehouse = $create($request->validated());

        return response()->json(
            ['data' => WarehouseResource::make($warehouse)],
            201,
        );
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): WarehouseResource
    {
        $this->authorize('update', $warehouse);

        $payload = $request->validated();

        DB::transaction(function () use ($warehouse, $payload): void {
            // Same default-flip guard as creation — if the caller is promoting
            // this warehouse to default, demote any sibling first.
            if (($payload['is_default'] ?? false) === true && $warehouse->is_default === false) {
                Warehouse::query()
                    ->where('tenant_id', $warehouse->tenant_id)
                    ->where('id', '!=', $warehouse->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
            $warehouse->update($payload);
        });

        return WarehouseResource::make($warehouse->fresh());
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('delete', $warehouse);

        $warehouse->delete();

        return response()->json(['data' => ['message' => "Ombor o'chirildi"]]);
    }
}
