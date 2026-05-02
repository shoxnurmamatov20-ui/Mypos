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
 * Fired when a brand-new Order is committed to the DB. Listeners include the
 * `NotifyOnOrderPlaced` listener (in-app push) plus the broadcast layer below
 * which fan-outs to KDS + dashboard tabs over Reverb (Pusher protocol).
 *
 * NotTenantAware: broadcast jobs already encode tenant in the channel name
 * (`tenant.{id}.kitchen`), and the queued job re-loads the Order through the
 * BelongsToTenant scope on dequeue. We don't need Spatie to switch DB
 * connections per tenant — RLS does that at the SQL layer.
 */
class OrderPlaced implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public readonly Order $order)
    {
    }

    /**
     * Channels are tenant-scoped private channels. Auth lives in
     * routes/channels.php — KDS requires chef/manager/owner role,
     * dashboard requires manager/owner.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->order->tenant_id}.kitchen"),
            new PrivateChannel("tenant.{$this->order->tenant_id}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.placed';
    }

    /**
     * Keep the wire payload tiny — the client re-fetches details by id if it
     * needs them. We deliberately do NOT broadcast PII (delivery address,
     * encrypted phone) here.
     *
     * @return array<string, scalar|null|int>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->order->id,
            'tenant_id' => $this->order->tenant_id,
            'order_no' => $this->order->order_no,
            'type' => $this->order->type,
            'status' => $this->order->status,
            'table_id' => $this->order->table_id,
            'table_no' => $this->order->table?->name,
            'items_count' => (int) ($this->order->items?->count() ?? 0),
            'total_amount' => (int) $this->order->total_amount,
            'currency' => $this->order->currency,
            'placed_at' => optional($this->order->placed_at)->toIso8601String(),
        ];
    }
}
