<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Actions\ClockInAction;
use App\Domain\Employee\Actions\ClockOutAction;
use App\Domain\Employee\Models\Employee;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Staff\ClockInRequest;
use App\Http\Resources\V1\Staff\ShiftResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffClockController extends Controller
{
    public function clockIn(ClockInRequest $request, ClockInAction $clockIn): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $shift = $clockIn($employee, [
            'shift_id' => $request->input('shift_id'),
            'source' => 'mobile',
            'metadata' => $request->input('metadata'),
        ]);

        return response()->json(
            ['data' => ['shift' => ShiftResource::make($shift->load('breaks'))]],
            201,
        );
    }

    public function clockOut(Request $request, ClockOutAction $clockOut): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $shift = $clockOut($employee, ['source' => 'mobile']);

        return response()->json([
            'data' => [
                'shift' => ShiftResource::make($shift->load('breaks')),
                'worked_minutes' => $shift->workedMinutes(),
            ],
        ]);
    }
}
