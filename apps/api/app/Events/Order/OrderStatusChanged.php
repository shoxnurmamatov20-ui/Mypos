<?php

declare(strict_types=1);

namespace App\Events\Order;

use App\Domain\Order\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when an order transitions between states (pending → preparing → ready
 * → served → completed / cancelled / refunded). Drives:
 *
 *  - Tenant dashboard counters / widgets
 *  - Customer-facing tracking page (private channel keyed by order id; auth
 *    via tracking_token query param — see routes/channels.php)
 *
 * NotTenantAware: tenant is encoded in the channel name; we don't touch
 * tenant-scoped DB during broadcast.
 */
class OrderStatusChanged implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly string $oldStatus,
        public readonly string $newStatus,
        public readonly ?int $etaMinutes = null,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->order->tenant_id}.dashboard"),
            new PrivateChannel("order.{$this->order->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status_changed';
    }

    /**
     * @return array<string, scalar|null|int>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'tenant_id' => $this->order->tenant_id,
            'order_no' => $this->order->order_no,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'eta_minutes' => $this->etaMinutes,
            'changed_at' => now()->toIso8601String(),
        ];
    }
}
