<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Models\CourierLocation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use App\Events\Order\CourierLocationUpdated;

/**
 * Insert a single GPS reading for the given courier.
 *
 * This path is hot — invoked roughly every 10s per active courier — so the
 * caller (controller) must keep validation + auth minimal and let this Action
 * just write the row.
 */
class RecordCourierLocationAction
{
    /**
     * @param  array{
     *     lat: float,
     *     lng: float,
     *     accuracy_meters?: float|null,
     *     heading?: float|null,
     *     speed_mps?: float|null,
     *     battery_percent?: int|null,
     *     order_id?: string|null,
     *     recorded_at?: string|\DateTimeInterface|null,
     * }  $payload
     */
    public function __invoke(Employee $courier, array $payload): CourierLocation
    {
        $location = CourierLocation::query()->create([
            'tenant_id' => $courier->tenant_id,
            'employee_id' => $courier->id,
            'order_id' => $payload['order_id'] ?? null,
            'lat' => (float) $payload['lat'],
            'lng' => (float) $payload['lng'],
            'accuracy_meters' => $payload['accuracy_meters'] ?? null,
            'heading' => $payload['heading'] ?? null,
            'speed_mps' => $payload['speed_mps'] ?? null,
            'battery_percent' => $payload['battery_percent'] ?? null,
            'recorded_at' => $payload['recorded_at'] ?? now(),
        ]);

        // Only broadcast when the GPS reading is tied to an active delivery.
        // This avoids flooding Reverb with idle pings (one read of the order is
        // cheap; without an `order_id` we skip entirely).
        if ($location->order_id !== null) {
            $order = Order::query()
                ->withoutGlobalScopes()
                ->whereKey($location->order_id)
                ->first();

            if ($order !== null
                && $order->courier_id === $courier->id
                && $order->picked_up_at !== null
                && $order->delivered_at === null
                && $order->cancelled_at === null
            ) {
                CourierLocationUpdated::dispatch($location);
            }
        }

        return $location;
    }
}
