<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Employee\Actions\DeliverOrderAction;
use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Staff\Courier\DeliverOrderRequest;
use App\Http\Resources\Api\V1\Staff\Courier\ActiveDeliveryResource;
use Illuminate\Http\JsonResponse;

class CourierDeliverController extends Controller
{
    use EnsuresCourier;

    /**
     * POST /api/v1/staff/courier/orders/{order}/deliver
     */
    public function deliver(
        DeliverOrderRequest $request,
        Order $order,
        DeliverOrderAction $deliver,
    ): JsonResponse {
        $courier = $this->courier($request);
        $this->assertOrderInTenant($courier, $order);

        $updated = $deliver($courier, $order, $request->validated());

        return response()->json(
            ['data' => ActiveDeliveryResource::make($updated)],
        );
    }
}
