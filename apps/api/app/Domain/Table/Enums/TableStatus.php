<?php

declare(strict_types=1);

namespace App\Domain\Table\Enums;

enum TableStatus: string
{
    case Available = 'available';
    case Occupied = 'occupied';
    case Reserved = 'reserved';
    case Disabled = 'disabled';

    public function label(): string
    {
        return match ($this) {
            self::Available => "Bo'sh",
            self::Occupied => 'Band',
            self::Reserved => 'Rezerv',
            self::Disabled => "O'chirilgan",
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Available => 'success',
            self::Occupied => 'danger',
            self::Reserved => 'warning',
            self::Disabled => 'gray',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
