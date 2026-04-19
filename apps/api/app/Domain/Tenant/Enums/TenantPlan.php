<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

enum TenantPlan: string
{
    case Free = 'free';
    case Starter = 'starter';
    case Pro = 'pro';
    case Business = 'business';
    case Enterprise = 'enterprise';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free',
            self::Starter => 'Starter',
            self::Pro => 'Pro',
            self::Business => 'Business',
            self::Enterprise => 'Enterprise',
        };
    }

    public function monthlyPriceUzs(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Starter => 390_000,
            self::Pro => 1_290_000,
            self::Business => 3_900_000,
            self::Enterprise => 0,
        };
    }

    public function locationLimit(): int
    {
        return match ($this) {
            self::Free, self::Starter => 1,
            self::Pro => 3,
            self::Business => 10,
            self::Enterprise => PHP_INT_MAX,
        };
    }

    public function staffLimit(): int
    {
        return match ($this) {
            self::Free => 2,
            self::Starter => 10,
            self::Pro => 30,
            self::Business => 100,
            self::Enterprise => PHP_INT_MAX,
        };
    }
}
