<?php

declare(strict_types=1);

namespace App\Events\Customer;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a customer submits a post-delivery review.
 *
 * Subscribers: web-dashboard (toast + reviews tab), web-ceo (aggregate view).
 */
class ReviewPosted implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly string $reviewId,
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly int $rating,
        public readonly ?string $comment = null,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->tenantId}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'review.posted';
    }

    /**
     * @return array<string, scalar|null>
     */
    public function broadcastWith(): array
    {
        return [
            'review_id' => $this->reviewId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'rating' => $this->rating,
            'has_comment' => $this->comment !== null && $this->comment !== '',
        ];
    }
}
