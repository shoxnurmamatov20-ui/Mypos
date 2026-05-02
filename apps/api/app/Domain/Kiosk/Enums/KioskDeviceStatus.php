<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Enums;

/**
 * Lifecycle states for a kiosk device.
 *
 * - Unpaired: device record exists but no token / not yet activated.
 * - Paired:   active and able to call /api/v1/kiosk/* endpoints.
 * - Disabled: deactivated by admin; token is rejected.
 */
enum KioskDeviceStatus: string
{
    case Unpaired = 'unpaired';
    case Paired = 'paired';
    case Disabled = 'disabled';

    public function label(): string
    {
        return match ($this) {
            self::Unpaired => 'Bog\'lanmagan',
            self::Paired => 'Faol',
            self::Disabled => 'O\'chirilgan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Unpaired => 'gray',
            self::Paired => 'success',
            self::Disabled => 'danger',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
