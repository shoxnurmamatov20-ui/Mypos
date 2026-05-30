<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Enums;

enum WasteStatus: string
{
    case Draft = 'draft';
    case Posted = 'posted';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Qoralama',
            self::Posted => 'Tasdiqlangan',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
