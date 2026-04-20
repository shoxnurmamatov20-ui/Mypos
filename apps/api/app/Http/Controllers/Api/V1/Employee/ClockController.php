<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Employee;

use App\Domain\Employee\Actions\ClockInAction;
use App\Domain\Employee\Actions\ClockOutAction;
use App\Domain\Employee\Models\Employee;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Employee\ShiftResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClockController extends Controller
{
    public function clockIn(Request $request, ClockInAction $clockIn): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'shift_id' => ['nullable', 'uuid', 'exists:shifts,id'],
            'source' => ['nullable', Rule::in(['manual', 'pos', 'mobile', 'kiosk'])],
            'metadata' => ['nullable', 'array'],
        ]);

        $employee = Employee::query()->findOrFail($data['employee_id']);

        $shift = $clockIn($employee, [
            'shift_id' => $data['shift_id'] ?? null,
            'source' => $data['source'] ?? 'manual',
            'metadata' => $data['metadata'] ?? null,
        ]);

        return response()->json(
            ['data' => ShiftResource::make($shift)],
            201,
        );
    }

    public function clockOut(Request $request, ClockOutAction $clockOut): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'source' => ['nullable', Rule::in(['manual', 'pos', 'mobile', 'kiosk'])],
            'metadata' => ['nullable', 'array'],
        ]);

        $employee = Employee::query()->findOrFail($data['employee_id']);

        $shift = $clockOut($employee, [
            'source' => $data['source'] ?? 'manual',
            'metadata' => $data['metadata'] ?? null,
        ]);

        return response()->json(
            ['data' => ShiftResource::make($shift)],
            200,
        );
    }
}
