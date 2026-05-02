<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Employee\Actions\AcceptDeliveryAction;
use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Staff\Courier\ActiveDeliveryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourierAcceptController extends Controller
{
    use EnsuresCourier;

    /**
     * POST /api/v1/staff/courier/orders/{order}/accept
     */
    public function accept(
        Request $request,
        Order $order,
        AcceptDeliveryAction $accept,
    ): JsonResponse {
        $courier = $this->courier($request);
        $this->assertOrderInTenant($courier, $order);

        $updated = $accept($courier, $order);

        return response()->json(
            ['data' => ActiveDeliveryResource::make($updated)],
        );
    }
}
