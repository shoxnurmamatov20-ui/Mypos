<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Warehouse;

use App\Domain\Warehouse\Actions\CreateWasteDocumentAction;
use App\Domain\Warehouse\Models\WasteDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreWasteDocumentRequest;
use App\Http\Resources\V1\Warehouse\WasteDocumentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WasteDocumentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', WasteDocument::class);

        $query = WasteDocument::query()
            ->with(['warehouse', 'creator'])
            ->withCount('items')
            ->orderBy('doc_date', 'desc')
            ->orderBy('doc_no', 'desc');

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->string('warehouse_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('reason')) {
            $query->where('reason', $request->string('reason'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('doc_date', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('doc_date', '<=', $request->date('date_to'));
        }
        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where('doc_no', 'like', "%{$search}%");
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return WasteDocumentResource::collection($query->paginate($perPage));
    }

    public function show(WasteDocument $wasteDocument): WasteDocumentResource
    {
        $this->authorize('view', $wasteDocument);

        return WasteDocumentResource::make(
            $wasteDocument->load(['warehouse', 'creator', 'items.ingredient']),
        );
    }

    public function store(
        StoreWasteDocumentRequest $request,
        CreateWasteDocumentAction $create,
    ): JsonResponse {
        $this->authorize('create', WasteDocument::class);

        $payload = $request->validated();
        $payload['created_by'] = $request->user()?->id;

        $document = $create($payload);

        return response()->json(
            ['data' => WasteDocumentResource::make(
                $document->load(['warehouse', 'creator', 'items.ingredient']),
            )],
            201,
        );
    }

    public function destroy(WasteDocument $wasteDocument): JsonResponse
    {
        $this->authorize('delete', $wasteDocument);

        $wasteDocument->delete();

        return response()->json(['data' => ['message' => "Hujjat o'chirildi"]]);
    }
}
