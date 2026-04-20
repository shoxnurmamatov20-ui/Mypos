<?php

declare(strict_types=1);

namespace App\Domain\Payment\Enums;

enum PaymentProvider: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Click = 'click';
    case Payme = 'payme';
    case Uzum = 'uzum';
    case Apelsin = 'apelsin';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Naqd',
            self::Card => 'Karta (POS)',
            self::Click => 'Click',
            self::Payme => 'Payme',
            self::Uzum => 'Uzum',
            self::Apelsin => 'Apelsin',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Cash => 'success',
            self::Card => 'info',
            self::Click => 'primary',
            self::Payme => 'warning',
            self::Uzum => 'gray',
            self::Apelsin => 'danger',
        };
    }

    /**
     * Whether this provider uses a gateway webhook flow (vs. manual capture).
     */
    public function isGateway(): bool
    {
        return match ($this) {
            self::Click, self::Payme, self::Uzum, self::Apelsin => true,
            self::Cash, self::Card => false,
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
