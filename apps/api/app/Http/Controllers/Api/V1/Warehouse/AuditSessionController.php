<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Warehouse;

use App\Domain\Warehouse\Actions\CompleteAuditSessionAction;
use App\Domain\Warehouse\Actions\StartAuditSessionAction;
use App\Domain\Warehouse\Models\AuditSession;
use App\Domain\Warehouse\Models\AuditSessionItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreAuditSessionRequest;
use App\Http\Requests\V1\Warehouse\UpdateAuditSessionRequest;
use App\Http\Resources\V1\Warehouse\AuditSessionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AuditSessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditSession::class);

        $query = AuditSession::query()
            ->with(['warehouse', 'conductor'])
            ->withCount('items')
            ->orderBy('started_at', 'desc');

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->string('warehouse_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return AuditSessionResource::collection($query->paginate($perPage));
    }

    public function show(AuditSession $auditSession): AuditSessionResource
    {
        $this->authorize('view', $auditSession);

        return AuditSessionResource::make(
            $auditSession->load(['warehouse', 'conductor', 'items.ingredient']),
        );
    }

    public function store(
        StoreAuditSessionRequest $request,
        StartAuditSessionAction $start,
    ): JsonResponse {
        $this->authorize('create', AuditSession::class);

        $payload = $request->validated();
        $payload['conducted_by'] = $request->user()?->id;

        $session = $start($payload);

        return response()->json(
            ['data' => AuditSessionResource::make(
                $session->load(['warehouse', 'conductor', 'items.ingredient']),
            )],
            201,
        );
    }

    /** Auditor records actual quantities — does NOT finalize. */
    public function update(
        UpdateAuditSessionRequest $request,
        AuditSession $auditSession,
    ): AuditSessionResource {
        $this->authorize('update', $auditSession);

        $payload = $request->validated();

        DB::transaction(function () use ($payload, $auditSession): void {
            if (array_key_exists('notes', $payload)) {
                $auditSession->update(['notes' => $payload['notes']]);
            }

            $items = $payload['items'] ?? [];
            foreach ($items as $row) {
                /** @var AuditSessionItem|null $item */
                $item = AuditSessionItem::query()
                    ->where('audit_session_id', $auditSession->id)
                    ->where('id', $row['id'])
                    ->first();

                if ($item === null) {
                    continue;
                }
                $actual = (float) $row['actual_quantity'];
                $item->update([
                    'actual_quantity' => $actual,
                    'discrepancy' => $actual - (float) $item->expected_quantity,
                    'notes' => $row['notes'] ?? $item->notes,
                ]);
            }
        });

        return AuditSessionResource::make(
            $auditSession->fresh(['warehouse', 'conductor', 'items.ingredient']),
        );
    }

    /** Finalizes the audit: applies stock adjustments + closes the session. */
    public function complete(
        Request $request,
        AuditSession $auditSession,
        CompleteAuditSessionAction $complete,
    ): AuditSessionResource {
        $this->authorize('complete', $auditSession);

        $session = $complete($auditSession, $request->user()?->id);

        return AuditSessionResource::make(
            $session->load(['warehouse', 'conductor', 'items.ingredient']),
        );
    }

    public function destroy(AuditSession $auditSession): JsonResponse
    {
        $this->authorize('delete', $auditSession);

        $auditSession->delete();

        return response()->json(['data' => ['message' => "Inventarizatsiya o'chirildi"]]);
    }
}
