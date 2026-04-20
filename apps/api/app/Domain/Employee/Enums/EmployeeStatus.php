<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

enum EmployeeStatus: string
{
    case Active = 'active';
    case OnLeave = 'on_leave';
    case Terminated = 'terminated';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Faol',
            self::OnLeave => "Ta'tilda",
            self::Terminated => 'Ishdan bo\'shatilgan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active => 'success',
            self::OnLeave => 'warning',
            self::Terminated => 'danger',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
