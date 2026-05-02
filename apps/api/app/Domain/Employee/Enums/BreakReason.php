<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

enum BreakReason: string
{
    case Lunch = 'lunch';
    case Rest = 'rest';
    case Personal = 'personal';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Lunch => 'Tushlik',
            self::Rest => 'Dam olish',
            self::Personal => 'Shaxsiy',
            self::Other => 'Boshqa',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $r): string => $r->value, self::cases());
    }
}
