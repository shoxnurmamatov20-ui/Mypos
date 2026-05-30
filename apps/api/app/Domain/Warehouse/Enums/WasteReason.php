<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Enums;

enum WasteReason: string
{
    case Expired = 'expired';
    case Damaged = 'damaged';
    case Lost = 'lost';
    case Theft = 'theft';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Expired => 'Muddati o\'tgan',
            self::Damaged => 'Buzilgan',
            self::Lost => 'Yo\'qotilgan',
            self::Theft => 'O\'g\'irlik',
            self::Other => 'Boshqa',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
