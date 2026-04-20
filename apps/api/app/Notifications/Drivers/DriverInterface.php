<?php

declare(strict_types=1);

namespace App\Notifications\Drivers;

interface DriverInterface
{
    /**
     * Send a message.
     *
     * @param  array<string, mixed>  $meta
     * @return array{
     *   success: bool,
     *   provider_message_id?: string|null,
     *   simulated?: bool,
     *   error?: string|null,
     *   raw?: array<string, mixed>,
     * }
     */
    public function send(string $recipient, string $subject, string $body, array $meta = []): array;
}
