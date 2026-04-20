<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Telegram Bot API driver.
 * POST https://api.telegram.org/bot{TOKEN}/sendMessage { chat_id, text, parse_mode }
 *
 * If TELEGRAM_BOT_TOKEN is unset, operates in simulated (log-only) mode.
 */
class TelegramDriver implements DriverInterface
{
    public function __construct(private readonly ConfigRepository $config)
    {
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array{success: bool, provider_message_id?: string|null, simulated?: bool, error?: string|null, raw?: array<string, mixed>}
     */
    public function send(string $recipient, string $subject, string $body, array $meta = []): array
    {
        $botToken = $this->config->get('services.telegram.bot_token');

        if (! is_string($botToken) || $botToken === '') {
            Log::info('notifications.telegram.simulated', [
                'chat_id' => $recipient,
                'body' => $body,
            ]);

            return [
                'success' => true,
                'simulated' => true,
                'provider_message_id' => null,
            ];
        }

        $text = $subject !== '' ? "*{$subject}*\n\n{$body}" : $body;

        try {
            $response = Http::acceptJson()->asJson()->post(
                "https://api.telegram.org/bot{$botToken}/sendMessage",
                [
                    'chat_id' => $recipient,
                    'text' => $text,
                    'parse_mode' => 'Markdown',
                ],
            );

            if ($response->successful() && $response->json('ok') === true) {
                $messageId = $response->json('result.message_id');
                Log::info('notifications.telegram.sent', [
                    'chat_id' => $recipient,
                    'message_id' => $messageId,
                ]);

                return [
                    'success' => true,
                    'provider_message_id' => $messageId !== null ? (string) $messageId : null,
                    'raw' => (array) $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => 'telegram_' . ($response->json('description') ?? 'http_' . $response->status()),
                'raw' => (array) $response->json(),
            ];
        } catch (Throwable $e) {
            Log::error('notifications.telegram.failed', [
                'chat_id' => $recipient,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
