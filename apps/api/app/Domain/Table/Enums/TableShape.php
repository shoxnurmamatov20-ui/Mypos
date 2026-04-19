<?php

declare(strict_types=1);

namespace App\Domain\Table\Enums;

enum TableShape: string
{
    case Round = 'round';
    case Square = 'square';
    case Rectangle = 'rectangle';
    case Oval = 'oval';

    public function label(): string
    {
        return match ($this) {
            self::Round => 'Yumaloq',
            self::Square => 'Kvadrat',
            self::Rectangle => 'To\'rtburchak',
            self::Oval => 'Oval',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
