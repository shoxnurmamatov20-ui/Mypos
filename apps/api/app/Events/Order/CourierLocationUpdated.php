<?php

declare(strict_types=1);

namespace App\Events\Order;

use App\Domain\Employee\Models\CourierLocation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a courier sends a GPS update tied to an active order. Caller
 * (RecordCourierLocationAction) must pre-filter so only "out-for-delivery"
 * tracks emit broadcasts — we don't want every idle courier flooding Reverb.
 *
 * Channel: `order.{orderId}` so the customer's tracking PWA + dispatcher
 * dashboard are the only listeners.
 *
 * NotTenantAware: order id is the channel partition; auth in channels.php.
 */
class CourierLocationUpdated implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly CourierLocation $location,
        public readonly ?int $etaMinutes = null,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // CourierLocation.order_id is required for broadcast — caller checks it.
        return [
            new PrivateChannel("order.{$this->location->order_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'courier.location_updated';
    }

    /**
     * @return array<string, scalar|null|float|int>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->location->order_id,
            'lat' => (float) $this->location->lat,
            'lng' => (float) $this->location->lng,
            'heading' => $this->location->heading !== null ? (float) $this->location->heading : null,
            'speed_mps' => $this->location->speed_mps !== null ? (float) $this->location->speed_mps : null,
            'eta_minutes' => $this->etaMinutes,
            'recorded_at' => optional($this->location->recorded_at)->toIso8601String(),
        ];
    }
}
