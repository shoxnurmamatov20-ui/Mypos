<?php

declare(strict_types=1);

namespace App\Events\Payment;

use App\Domain\Payment\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a Payment is moved into the `captured` state — either by cash
 * acknowledgement (CapturePaymentAction directly) or via a webhook from
 * Click / Payme.
 *
 * Drives:
 *  - tenant dashboard's revenue-counter widget (instant tick)
 *  - customer order-tracking page (so they see "paid" without a refresh)
 *
 * NotTenantAware: tenant + order id are encoded in channel names.
 */
class PaymentCaptured implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public readonly Payment $payment)
    {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel("tenant.{$this->payment->tenant_id}.dashboard"),
        ];

        if ($this->payment->order_id !== null) {
            $channels[] = new PrivateChannel("order.{$this->payment->order_id}");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.captured';
    }

    /**
     * @return array<string, scalar|null|int>
     */
    public function broadcastWith(): array
    {
        return [
            'payment_id' => $this->payment->id,
            'order_id' => $this->payment->order_id,
            'tenant_id' => $this->payment->tenant_id,
            'amount' => (int) $this->payment->amount,
            'currency' => $this->payment->currency,
            'method' => $this->payment->provider,
            'captured_at' => optional($this->payment->captured_at)->toIso8601String(),
        ];
    }
}
