<?php

declare(strict_types=1);

namespace App\Domain\Notification\Enums;

enum NotificationStatus: string
{
    case Queued = 'queued';
    case Sent = 'sent';
    case Failed = 'failed';
    case Delivered = 'delivered';
    case Read = 'read';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'Navbatda',
            self::Sent => 'Yuborildi',
            self::Failed => 'Xatolik',
            self::Delivered => 'Yetkazildi',
            self::Read => "O'qildi",
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Queued => 'gray',
            self::Sent => 'info',
            self::Failed => 'danger',
            self::Delivered => 'success',
            self::Read => 'primary',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
