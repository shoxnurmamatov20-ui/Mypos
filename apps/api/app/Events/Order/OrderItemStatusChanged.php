<?php

declare(strict_types=1);

namespace App\Events\Order;

use App\Domain\Order\Models\OrderItem;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a single OrderItem changes state on the kitchen line:
 *
 *   pending  → preparing  (chef claims item)
 *   preparing → ready     (item plated)
 *   ready    → served     (waiter delivers)
 *
 * Drives the KDS (`tenant.{id}.kitchen`) and the waiter / staff app
 * (`tenant.{id}.staff`) so a chef plating something instantly turns the row
 * green on every connected device.
 *
 * NotTenantAware: see OrderPlaced rationale.
 */
class OrderItemStatusChanged implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly OrderItem $item,
        public readonly string $oldStatus,
        public readonly string $newStatus,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->item->tenant_id}.kitchen"),
            new PrivateChannel("tenant.{$this->item->tenant_id}.staff"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.item.status_changed';
    }

    /**
     * @return array<string, scalar|null|int>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->item->order_id,
            'item_id' => $this->item->id,
            'tenant_id' => $this->item->tenant_id,
            'name' => $this->item->name_snapshot,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'cook_id' => $this->item->cook_id,
            'changed_at' => now()->toIso8601String(),
        ];
    }
}
