<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Warehouse;

use App\Domain\Warehouse\Actions\CreateIncomingDocumentAction;
use App\Domain\Warehouse\Models\IncomingDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreIncomingDocumentRequest;
use App\Http\Resources\V1\Warehouse\IncomingDocumentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IncomingDocumentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', IncomingDocument::class);

        $query = IncomingDocument::query()
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
        if ($request->filled('date_from')) {
            $query->whereDate('doc_date', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('doc_date', '<=', $request->date('date_to'));
        }
        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('doc_no', 'like', "%{$search}%")
                    ->orWhere('supplier_name', 'like', "%{$search}%")
                    ->orWhere('supplier_inn', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return IncomingDocumentResource::collection($query->paginate($perPage));
    }

    public function show(IncomingDocument $incomingDocument): IncomingDocumentResource
    {
        $this->authorize('view', $incomingDocument);

        return IncomingDocumentResource::make(
            $incomingDocument->load(['warehouse', 'creator', 'items.ingredient']),
        );
    }

    public function store(
        StoreIncomingDocumentRequest $request,
        CreateIncomingDocumentAction $create,
    ): JsonResponse {
        $this->authorize('create', IncomingDocument::class);

        $payload = $request->validated();
        $payload['created_by'] = $request->user()?->id;

        $document = $create($payload);

        return response()->json(
            ['data' => IncomingDocumentResource::make(
                $document->load(['warehouse', 'creator', 'items.ingredient']),
            )],
            201,
        );
    }

    public function destroy(IncomingDocument $incomingDocument): JsonResponse
    {
        $this->authorize('delete', $incomingDocument);

        $incomingDocument->delete();

        return response()->json(['data' => ['message' => "Hujjat o'chirildi"]]);
    }
}
