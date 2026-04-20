<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Notifications\Drivers\DriverInterface;
use InvalidArgumentException;

class NotificationManager
{
    /**
     * @param  array<string, DriverInterface>  $drivers
     */
    public function __construct(private readonly array $drivers)
    {
    }

    public function channel(string $channel): DriverInterface
    {
        if (! array_key_exists($channel, $this->drivers)) {
            throw new InvalidArgumentException("Notification channel [{$channel}] is not supported.");
        }

        return $this->drivers[$channel];
    }

    /** @return array<string, DriverInterface> */
    public function all(): array
    {
        return $this->drivers;
    }

    public function has(NotificationChannel $channel): bool
    {
        return array_key_exists($channel->value, $this->drivers);
    }
}
