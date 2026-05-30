<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Clinic\Actions\BulkComplaintAction;
use App\Domain\Clinic\Actions\ListComplaintsAction;
use App\Domain\Clinic\Actions\UpdateComplaintAction;
use App\Domain\Clinic\Models\ClinicComplaint;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\CEO\BulkComplaintRequest;
use App\Http\Requests\V1\CEO\ListComplaintsRequest;
use App\Http\Requests\V1\CEO\UpdateComplaintRequest;
use App\Http\Resources\V1\Clinic\ClinicComplaintResource;
use Illuminate\Http\JsonResponse;

/**
 * CEO complaints admin — port of the ShifoReyting admin complaints flow.
 *
 * Index returns a paginated, filtered list plus a `summary` block used by
 * the dashboard stat cards (total / open / in_review / resolved /
 * escalated / urgent / stale / avg_resolution_hours).
 *
 * Sits behind `auth:sanctum + ceo` middleware (see routes/api.php). The
 * Clinic vertical is platform-level so there's no tenant filtering — the
 * `EnsureCEO` middleware is enough.
 *
 * @group CEO — Complaints
 * @authenticated
 */
class ComplaintController extends Controller
{
    /**
     * List complaints
     *
     * Query params: q, clinic_id, region, severity (low/medium/high/urgent),
     * status (open/in_review/resolved/escalated), urgent (0/1), stale (1),
     * from (YYYY-MM-DD), to (YYYY-MM-DD), sort (created_at|severity|status|
     * resolved_at), dir (asc|desc), per (10–200, default 25).
     */
    public function index(ListComplaintsRequest $request, ListComplaintsAction $action): JsonResponse
    {
        $result = $action->execute($request->filters());

        return response()->json([
            'data' => ClinicComplaintResource::collection($result['paginator']->items()),
            'meta' => [
                'current_page' => $result['paginator']->currentPage(),
                'last_page' => $result['paginator']->lastPage(),
                'per_page' => $result['paginator']->perPage(),
                'total' => $result['paginator']->total(),
            ],
            'summary' => $result['summary'],
            'filters' => [
                'statuses' => ClinicComplaint::STATUSES,
                'severities' => ClinicComplaint::SEVERITIES,
                'stale_hours' => ClinicComplaint::STALE_HOURS,
            ],
        ]);
    }

    /**
     * Show one complaint
     */
    public function show(int $id): JsonResponse
    {
        $complaint = ClinicComplaint::query()
            ->with(['clinic:id,name,region', 'department:id,name', 'doctor:id,name,specialty'])
            ->find($id);

        if ($complaint === null) {
            return response()->json([
                'message' => __('Shikoyat topilmadi'),
            ], 404);
        }

        return response()->json([
            'data' => new ClinicComplaintResource($complaint),
        ]);
    }

    /**
     * Update a complaint — status, urgency, severity, append resolution note
     */
    public function update(int $id, UpdateComplaintRequest $request, UpdateComplaintAction $action): JsonResponse
    {
        $complaint = ClinicComplaint::query()->find($id);

        if ($complaint === null) {
            return response()->json([
                'message' => __('Shikoyat topilmadi'),
            ], 404);
        }

        $updated = $action->execute($complaint, $request->changes());

        return response()->json([
            'data' => new ClinicComplaintResource($updated),
        ]);
    }

    /**
     * Bulk action over selected complaint ids
     */
    public function bulk(BulkComplaintRequest $request, BulkComplaintAction $action): JsonResponse
    {
        $touched = $action->execute(
            action: $request->validated('action'),
            ids: $request->validated('ids', []),
            status: $request->validated('status'),
            note: $request->validated('resolution_note'),
        );

        return response()->json([
            'data' => [
                'touched' => $touched,
            ],
        ]);
    }

    /**
     * Distinct list of regions across clinics — used by the region filter
     * dropdown so the UI doesn't hard-code regions.
     */
    public function regions(): JsonResponse
    {
        $regions = \App\Domain\Clinic\Models\Clinic::query()
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->distinct()
            ->orderBy('region')
            ->pluck('region')
            ->all();

        return response()->json(['data' => $regions]);
    }
}
