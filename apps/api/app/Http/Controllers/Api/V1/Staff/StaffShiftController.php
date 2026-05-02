<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Staff\ShiftResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class StaffShiftController extends Controller
{
    /**
     * GET /api/v1/staff/shifts/current
     */
    public function current(Request $request): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $shift = Shift::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', [ShiftStatus::Open->value, 'in_progress'])
            ->orderByDesc('actual_start')
            ->with('breaks')
            ->first();

        return response()->json([
            'data' => $shift === null ? null : ShiftResource::make($shift),
        ]);
    }

    /**
     * GET /api/v1/staff/shifts
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $query = Shift::query()
            ->where('employee_id', $employee->id)
            ->orderByDesc('scheduled_start')
            ->with('breaks');

        if ($request->filled('from')) {
            $query->where('scheduled_start', '>=', Carbon::parse((string) $request->string('from')));
        }
        if ($request->filled('to')) {
            $query->where('scheduled_start', '<=', Carbon::parse((string) $request->string('to')));
        }

        $perPage = min((int) $request->integer('per_page', 20), 100);

        return ShiftResource::collection($query->paginate($perPage));
    }
}
