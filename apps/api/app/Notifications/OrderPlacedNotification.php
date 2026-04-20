<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationPreference;
use App\Domain\Order\Models\Order;
use App\Notifications\Actions\SendNotificationAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Notification fired when a new order is placed.
 * Channels are selected per-user via NotificationPreference.
 */
class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = [NotificationChannel::InApp->value];

        if (property_exists($notifiable, 'uuid') && is_string($notifiable->uuid)) {
            $prefs = [
                NotificationChannel::Email,
                NotificationChannel::SMS,
                NotificationChannel::Push,
                NotificationChannel::Telegram,
            ];
            foreach ($prefs as $channel) {
                if (NotificationPreference::isEnabled(
                    $notifiable->uuid,
                    $channel->value,
                    NotificationTemplate::OrderPlaced->value,
                )) {
                    $channels[] = $channel->value;
                }
            }
        }

        return array_values(array_unique($channels));
    }

    /**
     * Fallback to database channel (Laravel built-in); custom channels handled
     * via our own pipeline through dispatching SendNotificationAction in jobs.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_no' => $this->order->order_no,
            'total' => $this->order->total_amount,
            'template' => NotificationTemplate::OrderPlaced->value,
        ];
    }

    /**
     * Build the per-notification data payload used by SendNotificationAction.
     *
     * @return array<string, scalar|null>
     */
    public function payload(object $notifiable): array
    {
        $name = property_exists($notifiable, 'name') ? (string) ($notifiable->name ?? '') : '';

        return [
            'order_no' => $this->order->order_no,
            'customer_name' => $name,
            'total' => (string) $this->order->total_amount,
        ];
    }

    public function template(): NotificationTemplate
    {
        return NotificationTemplate::OrderPlaced;
    }

    public function sendViaChannel(
        SendNotificationAction $send,
        NotificationChannel $channel,
        string $recipient,
        string $tenantId,
        object $notifiable,
    ): void {
        $send(
            tenantId: $tenantId,
            channel: $channel,
            recipient: $recipient,
            template: $this->template(),
            data: $this->payload($notifiable),
            extraMeta: ['order_id' => $this->order->id],
        );
    }
}
