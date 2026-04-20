<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Employee;

use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Shift;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Employee\ScheduleShiftRequest;
use App\Http\Resources\V1\Employee\ShiftResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class ShiftController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Shift::query()
            ->with(['employee.user'])
            ->orderByDesc('scheduled_start');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->string('employee_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('from')) {
            $query->where('scheduled_start', '>=', Carbon::parse((string) $request->string('from')));
        }
        if ($request->filled('to')) {
            $query->where('scheduled_start', '<=', Carbon::parse((string) $request->string('to')));
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return ShiftResource::collection($query->paginate($perPage));
    }

    public function store(ScheduleShiftRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? ShiftStatus::Scheduled->value;

        $shift = Shift::create($data);

        return response()->json(
            ['data' => ShiftResource::make($shift->load(['employee.user']))],
            201,
        );
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $shift->delete();

        return response()->json(['data' => ['message' => "Smena o'chirildi"]]);
    }
}
