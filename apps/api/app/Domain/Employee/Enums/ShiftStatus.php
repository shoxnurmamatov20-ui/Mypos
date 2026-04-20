<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

enum ShiftStatus: string
{
    case Scheduled = 'scheduled';
    case Open = 'open';
    case Closed = 'closed';
    case Missed = 'missed';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Rejalashtirilgan',
            self::Open => 'Boshlangan',
            self::Closed => 'Yakunlangan',
            self::Missed => "O'tkazilgan",
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Scheduled => 'info',
            self::Open => 'success',
            self::Closed => 'gray',
            self::Missed => 'danger',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
