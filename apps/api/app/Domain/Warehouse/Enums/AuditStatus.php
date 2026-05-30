<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Enums;

enum AuditStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::InProgress => 'Davom etmoqda',
            self::Completed => 'Yakunlangan',
            self::Cancelled => 'Bekor qilingan',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
