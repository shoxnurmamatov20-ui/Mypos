<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Actions\EndBreakAction;
use App\Domain\Employee\Actions\StartBreakAction;
use App\Domain\Employee\Models\Employee;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Staff\StartBreakRequest;
use App\Http\Resources\V1\Staff\ShiftBreakResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffBreakController extends Controller
{
    public function start(StartBreakRequest $request, StartBreakAction $start): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $break = $start($employee, [
            'reason' => $request->input('reason'),
            'notes' => $request->input('notes'),
        ]);

        return response()->json(
            ['data' => ShiftBreakResource::make($break)],
            201,
        );
    }

    public function end(Request $request, EndBreakAction $end): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $break = $end($employee);

        return response()->json([
            'data' => ShiftBreakResource::make($break),
        ]);
    }
}
