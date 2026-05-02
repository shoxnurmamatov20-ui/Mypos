<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Auth\UserResource;
use App\Http\Resources\V1\Staff\EmployeeResource;
use App\Http\Resources\V1\Staff\ShiftBreakResource;
use App\Http\Resources\V1\Staff\ShiftResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffMeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');
        $employee->load('user');

        $currentShift = Shift::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', [ShiftStatus::Open->value, 'in_progress'])
            ->orderByDesc('actual_start')
            ->with('breaks')
            ->first();

        $activeBreak = ShiftBreak::query()
            ->where('employee_id', $employee->id)
            ->whereNull('ended_at')
            ->orderByDesc('started_at')
            ->first();

        return response()->json([
            'data' => [
                'user' => UserResource::make($request->user()),
                'employee' => EmployeeResource::make($employee),
                'current_shift' => $currentShift === null ? null : ShiftResource::make($currentShift),
                'active_break' => $activeBreak === null ? null : ShiftBreakResource::make($activeBreak),
            ],
        ]);
    }
}
