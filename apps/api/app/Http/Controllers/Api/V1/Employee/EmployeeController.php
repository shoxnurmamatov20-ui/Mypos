<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Employee;

use App\Domain\Employee\Actions\CreateEmployeeAction;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Employee\StoreEmployeeRequest;
use App\Http\Requests\V1\Employee\UpdateEmployeeRequest;
use App\Http\Resources\V1\Employee\EmployeeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Employee::query()
            ->with(['user', 'latestShift'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('position')) {
            $query->where('position', $request->string('position'));
        }
        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('employee_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search): void {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return EmployeeResource::collection($query->paginate($perPage));
    }

    public function show(Employee $employee): EmployeeResource
    {
        return EmployeeResource::make($employee->load(['user', 'latestShift']));
    }

    public function store(StoreEmployeeRequest $request, CreateEmployeeAction $create): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        $tenantId = $user->is_super_admin
            ? (string) $request->input('tenant_id', $user->tenant_id)
            : (string) $user->tenant_id;

        abort_if($tenantId === '', 422, 'tenant_id talab qilinadi');

        $validated = $request->validated();

        $employee = $create(
            $tenantId,
            $validated['user_data'],
            array_diff_key($validated, ['user_data' => true]),
        );

        return response()->json(
            ['data' => EmployeeResource::make($employee->load(['user', 'latestShift']))],
            201,
        );
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): EmployeeResource
    {
        $validated = $request->validated();

        DB::transaction(function () use ($employee, $validated): void {
            if (isset($validated['user_data']) && is_array($validated['user_data'])) {
                $employee->user?->update($validated['user_data']);
            }

            if (isset($validated['status'])
                && $validated['status'] === EmployeeStatus::Terminated->value
                && $employee->terminated_at === null
            ) {
                $validated['terminated_at'] = now();
            }

            $employee->update(array_diff_key($validated, ['user_data' => true]));
        });

        return EmployeeResource::make($employee->fresh(['user', 'latestShift']));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json(['data' => ['message' => "Xodim o'chirildi"]]);
    }
}
