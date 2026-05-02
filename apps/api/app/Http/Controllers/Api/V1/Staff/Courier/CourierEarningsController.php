<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Employee\Actions\ComputeCourierEarningsAction;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Staff\Courier\EarningsRequest;
use App\Http\Resources\Api\V1\Staff\Courier\CourierEarningsResource;
use Illuminate\Http\JsonResponse;

class CourierEarningsController extends Controller
{
    use EnsuresCourier;

    /**
     * GET /api/v1/staff/courier/earnings?period=today|week|month
     */
    public function show(
        EarningsRequest $request,
        ComputeCourierEarningsAction $compute,
    ): JsonResponse {
        $courier = $this->courier($request);

        $data = $compute($courier, $request->period());

        return response()->json([
            'data' => CourierEarningsResource::make($data)->toArray($request),
        ]);
    }
}
