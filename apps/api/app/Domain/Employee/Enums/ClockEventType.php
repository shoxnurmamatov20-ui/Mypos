<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

enum ClockEventType: string
{
    case ClockIn = 'clock_in';
    case ClockOut = 'clock_out';
    case BreakStart = 'break_start';
    case BreakEnd = 'break_end';

    public function label(): string
    {
        return match ($this) {
            self::ClockIn => 'Ishga kirish',
            self::ClockOut => 'Ishdan chiqish',
            self::BreakStart => 'Tanaffus boshlandi',
            self::BreakEnd => 'Tanaffus tugadi',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
