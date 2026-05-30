<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Enums;

enum TransferStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Received = 'received';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Qoralama',
            self::Sent => 'Yuborilgan',
            self::Received => 'Qabul qilingan',
            self::Cancelled => 'Bekor qilingan',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
