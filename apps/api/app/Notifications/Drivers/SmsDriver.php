<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Eskiz.uz SMS driver.
 *
 * Flow:
 *   POST {base}/auth/login  → { token }
 *   POST {base}/message/sms/send  (Bearer token)
 *
 * If credentials are missing, operates in log-only (simulated) mode.
 */
class SmsDriver implements DriverInterface
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
        $baseUrl = (string) $this->config->get('services.eskiz.base_url');
        $email = $this->config->get('services.eskiz.email');
        $password = $this->config->get('services.eskiz.password');

        if (empty($email) || empty($password)) {
            Log::info('notifications.sms.simulated', [
                'recipient' => $recipient,
                'body' => $body,
            ]);

            return [
                'success' => true,
                'simulated' => true,
                'provider_message_id' => null,
            ];
        }

        try {
            $token = $this->authenticate($baseUrl, (string) $email, (string) $password);
            if ($token === null) {
                return ['success' => false, 'error' => 'eskiz_auth_failed'];
            }

            $response = Http::withToken($token)
                ->asForm()
                ->post($baseUrl . '/message/sms/send', [
                    'mobile_phone' => $recipient,
                    'message' => $body,
                    'from' => '4546',
                ]);

            if ($response->successful()) {
                Log::info('notifications.sms.sent', [
                    'recipient' => $recipient,
                    'id' => $response->json('id'),
                ]);

                return [
                    'success' => true,
                    'provider_message_id' => (string) ($response->json('id') ?? ''),
                    'raw' => (array) $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => 'eskiz_http_' . $response->status(),
                'raw' => (array) $response->json(),
            ];
        } catch (Throwable $e) {
            Log::error('notifications.sms.failed', [
                'recipient' => $recipient,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function authenticate(string $baseUrl, string $email, string $password): ?string
    {
        $response = Http::asForm()->post($baseUrl . '/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);

        if (! $response->successful()) {
            return null;
        }

        $token = $response->json('data.token');

        return is_string($token) ? $token : null;
    }
}
