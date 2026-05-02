<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

/**
 * Phase 2 — capability tier (separate from `subscription_plan`).
 *
 * Drives feature gates: custom domains, custom CSS, white-label app, etc.
 *
 * Stub created by Agent C4 (Filament). Agent C3 owns the source of truth
 * for capabilities & price points; Agent C4 only consumes labels + ordering.
 *
 * If Agent C3 ships a richer enum (e.g. with capability methods), this stub
 * should be replaced — only the `value` strings are load-bearing.
 */
enum TenantTier: string
{
    case Free = 'free';
    case Pro = 'pro';
    case Plus = 'plus';
    case Enterprise = 'enterprise';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free',
            self::Pro => 'Pro',
            self::Plus => 'Plus',
            self::Enterprise => 'Enterprise',
        };
    }

    /** Numeric ordering — higher = more features. */
    public function rank(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Pro => 1,
            self::Plus => 2,
            self::Enterprise => 3,
        };
    }

    public function atLeast(self $other): bool
    {
        return $this->rank() >= $other->rank();
    }
}
