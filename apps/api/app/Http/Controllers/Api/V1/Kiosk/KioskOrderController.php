<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Actions\PlaceKioskOrderAction;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Events\Order\OrderPlaced;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Kiosk\PlaceKioskOrderRequest;
use App\Http\Resources\V1\Kiosk\KioskOrderResource;
use Illuminate\Http\JsonResponse;

class KioskOrderController extends Controller
{
    public function store(
        PlaceKioskOrderRequest $request,
        PlaceKioskOrderAction $place,
    ): JsonResponse {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        $order = $place($device, $payload);

        // Fan-out to KDS / staff app via the same event the staff order flow
        // uses — the kiosk is just another origin for an order.
        if (class_exists(OrderPlaced::class)) {
            OrderPlaced::dispatch($order);
        }

        return response()->json(
            ['data' => KioskOrderResource::make($order)],
            201,
        );
    }
}
