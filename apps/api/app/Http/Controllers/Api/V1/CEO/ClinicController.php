<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Clinic\Actions\GetClinicAction;
use App\Domain\Clinic\Actions\ListClinicsAction;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicFeedback;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Clinic\ClinicDetailResource;
use App\Http\Resources\V1\Clinic\ClinicDoctorResource;
use App\Http\Resources\V1\Clinic\ClinicFeedbackResource;
use App\Http\Resources\V1\Clinic\ClinicResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Clinic vertical for the CEO panel (port of ShifoReyting healthcare-rating).
 *
 * Platform-level (NOT tenant-scoped) — the CEO panel surfaces clinics as a
 * separate sidebar item alongside restaurants. All endpoints sit behind
 * `auth:sanctum + ceo` middleware (see routes/api.php).
 *
 * @group CEO — Clinics
 *
 * @authenticated
 */
class ClinicController extends Controller
{
    /**
     * List clinics
     *
     * Returns every clinic with aggregated stats: departments/doctors counts,
     * feedback rollup (total, avg rating, verified count) and complaints
     * breakdown (open, urgent). One query per aggregate — no N+1.
     */
    public function index(Request $request, ListClinicsAction $action): JsonResponse
    {
        $rows = $action->execute();

        return response()->json([
            'data' => ClinicResource::collection($rows),
            'meta' => ['count' => $rows->count()],
        ]);
    }

    /**
     * Show a single clinic with full details
     *
     * Eager-loads departments (with doctor counts), doctors (with their
     * department), the 20 most-recent feedback entries, and open complaints.
     */
    public function show(int $id, GetClinicAction $action): JsonResponse
    {
        $clinic = $action->execute($id);

        if ($clinic === null) {
            return response()->json([
                'message' => __('Klinika topilmadi'),
            ], 404);
        }

        return response()->json([
            'data' => new ClinicDetailResource($clinic),
        ]);
    }

    /**
     * List doctors for a clinic
     */
    public function doctors(int $id): JsonResponse
    {
        $clinic = Clinic::query()->find($id);

        if ($clinic === null) {
            return response()->json([
                'message' => __('Klinika topilmadi'),
            ], 404);
        }

        $doctors = $clinic->doctors()
            ->with('department:id,name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => ClinicDoctorResource::collection($doctors),
            'meta' => ['count' => $doctors->count()],
        ]);
    }

    /**
     * List departments for a clinic — powers the doctor-form dropdown.
     */
    public function departments(int $id): JsonResponse
    {
        $clinic = Clinic::query()->find($id);

        if ($clinic === null) {
            return response()->json([
                'message' => __('Klinika topilmadi'),
            ], 404);
        }

        $departments = ClinicDepartment::query()
            ->where('clinic_id', $clinic->id)
            ->withCount('doctors')
            ->orderBy('name')
            ->get(['id', 'clinic_id', 'name', 'is_active']);

        return response()->json([
            'data' => $departments->map(fn (ClinicDepartment $dep): array => [
                'id' => $dep->id,
                'name' => $dep->name,
                'doctors_count' => (int) ($dep->doctors_count ?? 0),
                'is_active' => (bool) $dep->is_active,
            ]),
            'meta' => ['count' => $departments->count()],
        ]);
    }

    /**
     * List recent feedback for a clinic (latest 50)
     */
    public function feedback(int $id): JsonResponse
    {
        $clinic = Clinic::query()->find($id);

        if ($clinic === null) {
            return response()->json([
                'message' => __('Klinika topilmadi'),
            ], 404);
        }

        $feedback = ClinicFeedback::query()
            ->where('clinic_id', $id)
            ->orderByDesc('submitted_at')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => ClinicFeedbackResource::collection($feedback),
            'meta' => ['count' => $feedback->count()],
        ]);
    }
}
