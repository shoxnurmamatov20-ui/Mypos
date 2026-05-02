<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

/**
 * Restaurant-floor staff positions used by the staff-mobile app.
 *
 * NOTE: this enum is used only for the staff API surface. Auth roles still
 * live in App\Domain\Auth\Enums\Role (Spatie permission labels).
 */
enum EmployeeRole: string
{
    case Waiter = 'waiter';
    case Cook = 'cook';
    case Cashier = 'cashier';
    case Manager = 'manager';
    case Admin = 'admin';
    case Courier = 'courier';

    public function label(): string
    {
        return match ($this) {
            self::Waiter => 'Ofitsiant',
            self::Cook => 'Oshpaz',
            self::Cashier => 'Kassir',
            self::Manager => 'Menejer',
            self::Admin => 'Administrator',
            self::Courier => 'Kuryer',
        };
    }

    public function isManagerial(): bool
    {
        return match ($this) {
            self::Manager, self::Admin => true,
            default => false,
        };
    }

    public function isKitchen(): bool
    {
        return $this === self::Cook;
    }

    public function isFloor(): bool
    {
        return match ($this) {
            self::Waiter, self::Cashier => true,
            default => false,
        };
    }

    public function isCourier(): bool
    {
        return $this === self::Courier;
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $r): string => $r->value, self::cases());
    }
}
