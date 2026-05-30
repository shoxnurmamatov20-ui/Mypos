<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Department;

use App\Domain\Department\Actions\CreateDepartmentAction;
use App\Domain\Department\Actions\UpdateDepartmentAction;
use App\Domain\Department\Models\Department;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Department\StoreDepartmentRequest;
use App\Http\Requests\V1\Department\UpdateDepartmentRequest;
use App\Http\Resources\V1\Department\DepartmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    public function __construct(
        private readonly CreateDepartmentAction $createDepartment,
        private readonly UpdateDepartmentAction $updateDepartment,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Department::query()
            ->withCount('employees')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $likeOp = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('name', $likeOp, "%{$search}%");
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return DepartmentResource::collection($query->paginate($perPage));
    }

    public function show(Department $department): DepartmentResource
    {
        return DepartmentResource::make($department->loadCount('employees'));
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        $tenantId = $user->is_super_admin
            ? (string) $request->input('tenant_id', $user->tenant_id)
            : (string) $user->tenant_id;

        abort_if($tenantId === '', 422, 'tenant_id talab qilinadi');

        $department = $this->createDepartment->execute($tenantId, $request->validated());

        return response()->json(
            ['data' => DepartmentResource::make($department->loadCount('employees'))],
            201,
        );
    }

    public function update(UpdateDepartmentRequest $request, Department $department): DepartmentResource
    {
        $updated = $this->updateDepartment->execute($department, $request->validated());

        return DepartmentResource::make($updated->loadCount('employees'));
    }

    public function destroy(Department $department): JsonResponse
    {
        $count = (int) $department->employees()->count();
        if ($count > 0) {
            return response()->json([
                'errors' => [
                    'department' => ["Bo'limda {$count} ta xodim bor — avval ularni boshqa bo'limga ko'chiring"],
                ],
            ], 422);
        }

        $department->delete();

        return response()->json(['data' => ['message' => "Bo'lim o'chirildi"]]);
    }
}
