<?php

declare(strict_types=1);

namespace App\Events\Order;

use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\OrderItem;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a chef self-assigns to an OrderItem (i.e. status moves
 * pending → preparing). Lets the rest of the kitchen line know "this item
 * is taken" without flicker / double-claiming.
 *
 * This event is complementary to OrderItemStatusChanged — that one is the
 * generic state-machine signal, this one is just the assignment notice with
 * the chef's name attached.
 *
 * NotTenantAware: see OrderPlaced rationale.
 */
class KitchenItemAssigned implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly OrderItem $item,
        public readonly Employee $chef,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->item->tenant_id}.kitchen"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'kitchen.item_assigned';
    }

    /**
     * @return array<string, scalar|null|int>
     */
    public function broadcastWith(): array
    {
        return [
            'item_id' => $this->item->id,
            'order_id' => $this->item->order_id,
            'chef_id' => $this->chef->id,
            'chef_name' => $this->chef->user?->name ?? 'Chef',
            'assigned_at' => now()->toIso8601String(),
        ];
    }
}
