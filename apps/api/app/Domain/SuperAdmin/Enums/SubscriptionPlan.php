<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Enums;

/**
 * Subscription plans for the new pricing tier (replaces / extends TenantPlan).
 * Mirrored on the SaaS dashboard.
 */
enum SubscriptionPlan: string
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

    /** Default monthly recurring revenue in minor units (so'm). */
    public function defaultMrrMinor(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Starter => 390_000_00,    // 390k * 100 (minor)
            self::Pro => 1_290_000_00,
            self::Business => 3_900_000_00,
            self::Enterprise => 0, // negotiated
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
