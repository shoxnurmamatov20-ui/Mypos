<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationPreference;
use App\Events\Order\OrderPlaced;
use App\Jobs\SendNotificationJob;
use App\Models\User;

/**
 * Notify the kitchen (in-app) + the ordering employee when a new order is placed.
 * Falls back to in-app only when user has no contact info.
 *
 * Runs synchronously in the request cycle. The heavy provider I/O happens in
 * the dispatched {@see SendNotificationJob}s, which carry the tenantId
 * explicitly and therefore don't require Spatie multitenancy tagging.
 */
class NotifyOnOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;

        if ($order->employee_id === null) {
            return;
        }

        /** @var User|null $employee */
        $employee = User::query()->where('uuid', $order->employee_id)->first();
        if ($employee === null) {
            return;
        }

        $data = [
            'order_no' => $order->order_no,
            'customer_name' => (string) ($employee->name ?? ''),
            'total' => (string) $order->total_amount,
        ];

        // In-app is always dispatched
        $this->dispatchChannel($order->tenant_id, NotificationChannel::InApp, $employee->uuid, $data, $order->id);

        // Optional channels based on user preference + contact availability
        $candidates = [
            [NotificationChannel::Email, $employee->email],
            [NotificationChannel::SMS, $employee->phone],
        ];

        foreach ($candidates as [$channel, $recipient]) {
            if (empty($recipient)) {
                continue;
            }
            $enabled = NotificationPreference::isEnabled(
                $employee->uuid,
                $channel->value,
                NotificationTemplate::OrderPlaced->value,
            );
            if (! $enabled) {
                continue;
            }
            $this->dispatchChannel($order->tenant_id, $channel, (string) $recipient, $data, $order->id);
        }
    }

    /**
     * @param  array<string, scalar|null>  $data
     */
    private function dispatchChannel(
        string $tenantId,
        NotificationChannel $channel,
        string $recipient,
        array $data,
        string $orderId,
    ): void {
        SendNotificationJob::dispatch(
            tenantId: $tenantId,
            channel: $channel->value,
            recipient: $recipient,
            template: NotificationTemplate::OrderPlaced->value,
            data: $data,
            extraMeta: ['order_id' => $orderId],
        );
    }
}
