<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationPreference;
use App\Notifications\Actions\SendNotificationAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LowStockAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $itemName,
        public readonly int $stockLevel,
    ) {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        $channels = [NotificationChannel::InApp->value, NotificationChannel::Email->value];

        if (property_exists($notifiable, 'uuid') && is_string($notifiable->uuid)) {
            $channels = array_values(array_filter($channels, fn (string $c): bool =>
                NotificationPreference::isEnabled(
                    $notifiable->uuid,
                    $c,
                    NotificationTemplate::LowStockAlert->value,
                ),
            ));
            if ($channels === []) {
                $channels = [NotificationChannel::InApp->value];
            }
        }

        return $channels;
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'item_name' => $this->itemName,
            'stock_level' => $this->stockLevel,
            'template' => NotificationTemplate::LowStockAlert->value,
        ];
    }

    /** @return array<string, scalar|null> */
    public function payload(object $notifiable): array
    {
        return [
            'item_name' => $this->itemName,
            'stock_level' => (string) $this->stockLevel,
        ];
    }

    public function template(): NotificationTemplate
    {
        return NotificationTemplate::LowStockAlert;
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
            extraMeta: ['item_name' => $this->itemName],
        );
    }
}
