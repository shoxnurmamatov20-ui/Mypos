<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Employee\Actions\RecordCourierLocationAction;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Staff\Courier\RecordLocationRequest;
use Illuminate\Http\JsonResponse;

class CourierLocationController extends Controller
{
    use EnsuresCourier;

    /**
     * POST /api/v1/staff/courier/location
     *
     * Hot path — invoked every ~10s per active courier. Keep work minimal:
     * (1) auth (handled by middleware), (2) role check, (3) insert.
     */
    public function store(
        RecordLocationRequest $request,
        RecordCourierLocationAction $record,
    ): JsonResponse {
        $courier = $this->courier($request);

        $location = $record($courier, $request->validated());

        return response()->json(
            ['data' => ['id' => $location->id]],
            201,
        );
    }
}
