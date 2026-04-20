<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Expo push driver.
 * POST https://exp.host/--/api/v2/push/send { to, title, body }
 *
 * If EXPO_ACCESS_TOKEN is set, passes it as Bearer.
 */
class PushDriver implements DriverInterface
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
        $pushUrl = (string) $this->config->get('services.expo.push_url', 'https://exp.host/--/api/v2/push/send');
        $accessToken = $this->config->get('services.expo.access_token');

        if (empty($recipient)) {
            Log::info('notifications.push.simulated', [
                'recipient' => $recipient,
                'title' => $subject,
                'body' => $body,
            ]);

            return [
                'success' => true,
                'simulated' => true,
                'provider_message_id' => null,
            ];
        }

        try {
            $request = Http::acceptJson()->asJson();
            if (is_string($accessToken) && $accessToken !== '') {
                $request = $request->withToken($accessToken);
            }

            $response = $request->post($pushUrl, [
                'to' => $recipient,
                'title' => $subject,
                'body' => $body,
                'data' => $meta,
            ]);

            if ($response->successful()) {
                $ticketId = $response->json('data.id');
                Log::info('notifications.push.sent', [
                    'recipient' => $recipient,
                    'id' => $ticketId,
                ]);

                return [
                    'success' => true,
                    'provider_message_id' => is_string($ticketId) ? $ticketId : null,
                    'raw' => (array) $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => 'expo_http_' . $response->status(),
                'raw' => (array) $response->json(),
            ];
        } catch (Throwable $e) {
            Log::error('notifications.push.failed', [
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
