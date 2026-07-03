<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Unit;

use App\Domain\Unit\Models\UnitOfMeasure;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Unit\StoreUnitOfMeasureRequest;
use App\Http\Requests\V1\Unit\UpdateUnitOfMeasureRequest;
use App\Http\Resources\V1\Unit\UnitOfMeasureResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class UnitOfMeasureController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', UnitOfMeasure::class);

        $query = UnitOfMeasure::query()
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            // MySQL utf8mb4_unicode_ci collation makes LIKE case-insensitive,
            // matching Postgres ILIKE. Driver-portable.
            $likeOp = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $likeOp): void {
                $q->where('name', $likeOp, "%{$search}%")
                    ->orWhere('abbreviation', $likeOp, "%{$search}%");
            });
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return UnitOfMeasureResource::collection($query->paginate($perPage));
    }

    public function show(UnitOfMeasure $unit): UnitOfMeasureResource
    {
        $this->authorize('view', $unit);

        return UnitOfMeasureResource::make($unit);
    }

    public function store(StoreUnitOfMeasureRequest $request): JsonResponse
    {
        $this->authorize('create', UnitOfMeasure::class);

        $unit = UnitOfMeasure::create($request->validated());

        return response()->json(
            // refresh() picks up DB defaults (is_active=true, sort_order) the
            // in-memory model doesn't have when the client omitted them.
            ['data' => UnitOfMeasureResource::make($unit->refresh())],
            201,
        );
    }

    public function update(UpdateUnitOfMeasureRequest $request, UnitOfMeasure $unit): UnitOfMeasureResource
    {
        $this->authorize('update', $unit);

        $unit->update($request->validated());

        return UnitOfMeasureResource::make($unit->fresh());
    }

    public function destroy(UnitOfMeasure $unit): JsonResponse
    {
        $this->authorize('delete', $unit);

        $unit->delete();

        return response()->json(['data' => ['message' => "O'lchov birligi o'chirildi"]]);
    }
}
