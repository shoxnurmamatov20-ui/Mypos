<?php

declare(strict_types=1);

namespace App\Domain\Notification\Enums;

enum NotificationChannel: string
{
    case Email = 'email';
    case SMS = 'sms';
    case Push = 'push';
    case Telegram = 'telegram';
    case InApp = 'in_app';

    public function label(): string
    {
        return match ($this) {
            self::Email => 'Email',
            self::SMS => 'SMS',
            self::Push => 'Push',
            self::Telegram => 'Telegram',
            self::InApp => 'In-App',
        };
    }

    /**
     * Required fields on recipient/user to deliver via this channel.
     *
     * @return array<string>
     */
    public function requiredFields(): array
    {
        return match ($this) {
            self::Email => ['email'],
            self::SMS => ['phone'],
            self::Push => ['device_token'],
            self::Telegram => ['telegram_chat_id'],
            self::InApp => ['uuid'],
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
