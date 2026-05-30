<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\CEO;

use App\Domain\Clinic\Actions\CreateDoctorAction;
use App\Domain\Clinic\Actions\ListDoctorsAction;
use App\Domain\Clinic\Actions\UpdateDoctorAction;
use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Clinic\Models\ClinicFeedback;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Clinic\StoreClinicDoctorRequest;
use App\Http\Requests\V1\Clinic\UpdateClinicDoctorRequest;
use App\Http\Resources\V1\Clinic\ClinicDoctorResource;
use App\Http\Resources\V1\Clinic\DoctorListItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Doctor management for the CEO panel /dashboard/doctors page.
 *
 * Cross-clinic flat-list CRUD that mirrors ShifoReyting's admin doctor
 * surface. Sits behind `auth:sanctum + ceo` middleware.
 *
 * @group CEO — Doctors
 * @authenticated
 */
class DoctorController extends Controller
{
    /**
     * List doctors (paginated, filterable, sortable).
     *
     * Query params: q, clinic_id, department_id, specialty, is_active,
     * sort (name|specialty|created_at), dir (asc|desc), per_page, page.
     */
    public function index(Request $request, ListDoctorsAction $action): JsonResponse
    {
        $page = $action->execute([
            'q' => (string) $request->query('q', ''),
            'clinic_id' => $request->query('clinic_id'),
            'department_id' => $request->query('department_id'),
            'specialty' => (string) $request->query('specialty', ''),
            'is_active' => $request->query('is_active'),
            'sort' => (string) $request->query('sort', 'name'),
            'dir' => (string) $request->query('dir', 'asc'),
            'per_page' => $request->query('per_page', 25),
        ]);

        return response()->json([
            'data' => DoctorListItemResource::collection($page->items()),
            'meta' => [
                'total' => $page->total(),
                'per_page' => $page->perPage(),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
            ],
            'summary' => $this->summary(),
        ]);
    }

    /**
     * Show a single doctor.
     */
    public function show(int $id): JsonResponse
    {
        $doctor = ClinicDoctor::query()
            ->with(['clinic:id,name,slug,region', 'department:id,name'])
            ->find($id);

        if ($doctor === null) {
            return response()->json([
                'message' => __('Shifokor topilmadi'),
            ], 404);
        }

        return response()->json([
            'data' => new ClinicDoctorResource($doctor),
        ]);
    }

    public function store(StoreClinicDoctorRequest $request, CreateDoctorAction $action): JsonResponse
    {
        $doctor = $action->execute($request->validated());

        $doctor->load(['clinic:id,name,slug,region', 'department:id,name']);

        return response()->json([
            'data' => new ClinicDoctorResource($doctor),
        ], 201);
    }

    public function update(int $id, UpdateClinicDoctorRequest $request, UpdateDoctorAction $action): JsonResponse
    {
        $doctor = ClinicDoctor::query()->find($id);

        if ($doctor === null) {
            return response()->json([
                'message' => __('Shifokor topilmadi'),
            ], 404);
        }

        $doctor = $action->execute($doctor, $request->validated());

        return response()->json([
            'data' => new ClinicDoctorResource($doctor),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $doctor = ClinicDoctor::query()->find($id);

        if ($doctor === null) {
            return response()->json([
                'message' => __('Shifokor topilmadi'),
            ], 404);
        }

        // Mirror ShifoReyting: refuse delete when feedback exists. Soft-disable
        // via is_active is the safe path.
        if (ClinicFeedback::query()->where('doctor_id', $doctor->id)->exists()) {
            return response()->json([
                'message' => __("Bu shifokorda fikrlar mavjud — o'chirib bo'lmaydi. Avval deaktivatsiya qiling."),
            ], 422);
        }

        $doctor->delete();

        return response()->json([
            'data' => ['message' => __("Shifokor o'chirildi")],
        ]);
    }

    /**
     * Cascade dropdown helper: GET /clinics/{id}/departments
     */
    public function departmentsByClinic(int $id): JsonResponse
    {
        $deps = ClinicDepartment::query()
            ->where('clinic_id', $id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'data' => $deps,
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function summary(): array
    {
        $total = (int) ClinicDoctor::query()->count();
        $active = (int) ClinicDoctor::query()->where('is_active', true)->count();
        $clinics = (int) Clinic::query()->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'clinics_count' => $clinics,
        ];
    }
}
