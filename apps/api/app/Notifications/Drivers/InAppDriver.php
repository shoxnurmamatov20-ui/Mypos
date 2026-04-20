<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

use Illuminate\Support\Facades\Log;

/**
 * In-app driver: just records delivery.
 *
 * Consumers read via `GET /api/v1/notifications` and optionally via the
 * realtime (Reverb) channel.
 */
class InAppDriver implements DriverInterface
{
    /**
     * @param  array<string, mixed>  $meta
     * @return array{success: bool, provider_message_id?: string|null}
     */
    public function send(string $recipient, string $subject, string $body, array $meta = []): array
    {
        Log::info('notifications.in_app.recorded', [
            'recipient' => $recipient,
            'subject' => $subject,
        ]);

        return [
            'success' => true,
            'provider_message_id' => null,
        ];
    }
}
