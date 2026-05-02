<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Employee\Actions\CancelDeliveryAction;
use App\Domain\Employee\Enums\DeliveryCancelReason;
use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Staff\Courier\CancelDeliveryRequest;
use App\Http\Resources\Api\V1\Staff\Courier\ActiveDeliveryResource;
use Illuminate\Http\JsonResponse;

class CourierCancelController extends Controller
{
    use EnsuresCourier;

    /**
     * POST /api/v1/staff/courier/orders/{order}/cancel
     */
    public function cancel(
        CancelDeliveryRequest $request,
        Order $order,
        CancelDeliveryAction $cancel,
    ): JsonResponse {
        $courier = $this->courier($request);
        $this->assertOrderInTenant($courier, $order);

        $reason = DeliveryCancelReason::from((string) $request->validated('reason'));
        $notes = $request->validated('notes');

        $updated = $cancel($courier, $order, $reason, is_string($notes) ? $notes : null);

        return response()->json(
            ['data' => ActiveDeliveryResource::make($updated)],
        );
    }
}
