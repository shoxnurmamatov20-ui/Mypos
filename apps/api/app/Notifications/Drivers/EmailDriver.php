<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

use Illuminate\Contracts\Mail\Factory as MailFactory;
use Illuminate\Support\Facades\Log;
use Throwable;

class EmailDriver implements DriverInterface
{
    public function __construct(private readonly MailFactory $mailer)
    {
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array{success: bool, provider_message_id?: string|null, error?: string|null, raw?: array<string, mixed>}
     */
    public function send(string $recipient, string $subject, string $body, array $meta = []): array
    {
        try {
            $this->mailer->mailer()
                ->raw($body, function ($message) use ($recipient, $subject): void {
                    $message->to($recipient)->subject($subject);
                });

            Log::info('notifications.email.sent', [
                'recipient' => $recipient,
                'subject' => $subject,
            ]);

            return [
                'success' => true,
                'provider_message_id' => null,
            ];
        } catch (Throwable $e) {
            Log::error('notifications.email.failed', [
                'recipient' => $recipient,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
