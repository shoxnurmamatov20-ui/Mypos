<?php

declare(strict_types=1);

namespace App\Domain\Customer\Enums;

enum LoyaltyTier: string
{
    case Bronze = 'bronze';
    case Silver = 'silver';
    case Gold = 'gold';
    case Platinum = 'platinum';

    public function label(): string
    {
        return match ($this) {
            self::Bronze => 'Bronza',
            self::Silver => 'Kumush',
            self::Gold => 'Oltin',
            self::Platinum => 'Platina',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Bronze => 'warning',
            self::Silver => 'gray',
            self::Gold => 'warning',
            self::Platinum => 'info',
        };
    }

    /**
     * Minimum lifetime spend (in UZS so'm = minor units) to qualify for this tier.
     */
    public function minSpend(): int
    {
        return match ($this) {
            self::Bronze => 0,
            self::Silver => 1_000_000,     // 1 mln so'm
            self::Gold => 5_000_000,       // 5 mln so'm
            self::Platinum => 20_000_000,  // 20 mln so'm
        };
    }

    /** Pick the best tier a lifetime spend qualifies for. */
    public static function fromSpend(int $lifetimeSpend): self
    {
        return match (true) {
            $lifetimeSpend >= self::Platinum->minSpend() => self::Platinum,
            $lifetimeSpend >= self::Gold->minSpend() => self::Gold,
            $lifetimeSpend >= self::Silver->minSpend() => self::Silver,
            default => self::Bronze,
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
