<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Clinic\Actions\CreateDoctorAction;
use App\Domain\Clinic\Actions\ListDoctorsAction;
use App\Domain\Clinic\Actions\UpdateDoctorAction;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Clinic\DoctorListItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * CEO doctor administration (clinics vertical). Flat cross-clinic list with
 * per-doctor stats, plus create/update/delete used by the doctors dashboard.
 * Clinics are platform-level (no tenant_id) — the `ceo` middleware gates
 * access; no tenant scoping applies here.
 */
class DoctorController extends Controller
{
    /**
     * GET /api/v1/ceo/doctors — filterable list + summary chips.
     */
    public function index(Request $request, ListDoctorsAction $action): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'clinic_id' => ['nullable', 'integer'],
            'department_id' => ['nullable', 'integer'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'in:0,1'],
            'sort' => ['nullable', 'in:name,specialty,created_at'],
            'dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = $action->execute($validated);

        return response()->json([
            'data' => DoctorListItemResource::collection($paginator->items()),
            'summary' => $this->summary(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/v1/ceo/doctors
     */
    public function store(Request $request, CreateDoctorAction $action): JsonResponse
    {
        $validated = $request->validate([
            'clinic_id' => ['required', 'integer', Rule::exists('clinics', 'id')],
            'department_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'photo_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $doctor = $action->execute($validated);
        $doctor->load(['clinic:id,name,slug,region', 'department:id,name']);

        return response()->json(
            ['data' => new DoctorListItemResource($doctor)],
            201,
        );
    }

    /**
     * PATCH /api/v1/ceo/doctors/{id}
     */
    public function update(Request $request, int $id, UpdateDoctorAction $action): JsonResponse
    {
        $doctor = ClinicDoctor::query()->findOrFail($id);

        $validated = $request->validate([
            'clinic_id' => ['sometimes', 'integer', Rule::exists('clinics', 'id')],
            'department_id' => ['sometimes', 'nullable', 'integer'],
            'name' => ['sometimes', 'string', 'min:2', 'max:255'],
            'specialty' => ['sometimes', 'nullable', 'string', 'max:255'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $doctor = $action->execute($doctor, $validated);
        $doctor->load(['clinic:id,name,slug,region', 'department:id,name']);

        return response()->json(['data' => new DoctorListItemResource($doctor)]);
    }

    /**
     * DELETE /api/v1/ceo/doctors/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $doctor = ClinicDoctor::query()->findOrFail($id);
        $doctor->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * One aggregate round-trip for the summary cards.
     *
     * @return array<string, int>
     */
    private function summary(): array
    {
        $agg = ClinicDoctor::query()
            ->selectRaw(
                'COUNT(*) AS total,
                 SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active,
                 COUNT(DISTINCT clinic_id) AS clinics_count',
            )
            ->first();

        $total = (int) ($agg->total ?? 0);
        $active = (int) ($agg->active ?? 0);

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'clinics_count' => (int) ($agg->clinics_count ?? 0),
        ];
    }
}
