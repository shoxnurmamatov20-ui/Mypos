<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Warehouse;

use App\Domain\Warehouse\Actions\CreateTransferAction;
use App\Domain\Warehouse\Models\TransferDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreTransferDocumentRequest;
use App\Http\Resources\V1\Warehouse\TransferDocumentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransferDocumentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TransferDocument::class);

        $query = TransferDocument::query()
            ->with(['fromWarehouse', 'toWarehouse', 'creator'])
            ->withCount('items')
            ->orderBy('doc_date', 'desc')
            ->orderBy('doc_no', 'desc');

        if ($request->filled('from_warehouse_id')) {
            $query->where('from_warehouse_id', $request->string('from_warehouse_id'));
        }
        if ($request->filled('to_warehouse_id')) {
            $query->where('to_warehouse_id', $request->string('to_warehouse_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('doc_date', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('doc_date', '<=', $request->date('date_to'));
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return TransferDocumentResource::collection($query->paginate($perPage));
    }

    public function show(TransferDocument $transferDocument): TransferDocumentResource
    {
        $this->authorize('view', $transferDocument);

        return TransferDocumentResource::make(
            $transferDocument->load(['fromWarehouse', 'toWarehouse', 'creator', 'items.ingredient']),
        );
    }

    public function store(
        StoreTransferDocumentRequest $request,
        CreateTransferAction $create,
    ): JsonResponse {
        $this->authorize('create', TransferDocument::class);

        $payload = $request->validated();
        $payload['created_by'] = $request->user()?->id;

        $document = $create($payload);

        return response()->json(
            ['data' => TransferDocumentResource::make(
                $document->load(['fromWarehouse', 'toWarehouse', 'creator', 'items.ingredient']),
            )],
            201,
        );
    }

    public function destroy(TransferDocument $transferDocument): JsonResponse
    {
        $this->authorize('delete', $transferDocument);

        $transferDocument->delete();

        return response()->json(['data' => ['message' => "Hujjat o'chirildi"]]);
    }
}
