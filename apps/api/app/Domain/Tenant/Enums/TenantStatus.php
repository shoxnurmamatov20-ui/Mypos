<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

enum TenantStatus: string
{
    case Trialing = 'trialing';
    case Active = 'active';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Trialing => 'Sinov muddati',
            self::Active => 'Faol',
            self::Suspended => "To'xtatilgan",
            self::Cancelled => 'Bekor qilingan',
        };
    }
}
