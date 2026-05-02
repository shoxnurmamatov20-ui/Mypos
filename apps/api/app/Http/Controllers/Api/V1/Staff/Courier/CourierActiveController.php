<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Staff\Courier\ActiveDeliveryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourierActiveController extends Controller
{
    use EnsuresCourier;

    /**
     * GET /api/v1/staff/courier/active
     *
     * Returns the courier's currently active delivery (if any).
     */
    public function show(Request $request): JsonResponse
    {
        $courier = $this->courier($request);

        $order = Order::query()
            ->where('courier_id', $courier->id)
            ->where('type', 'delivery')
            ->whereNull('delivered_at')
            ->whereNull('cancelled_at')
            ->with(['items', 'customer'])
            ->orderByDesc('picked_up_at')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'data' => $order === null ? null : ActiveDeliveryResource::make($order),
        ]);
    }
}
