<?php

declare(strict_types=1);

namespace App\Domain\Auth\Enums;

/**
 * Canonical role names used with spatie/laravel-permission.
 * Super admin is represented via `users.is_super_admin` boolean + this role.
 */
enum Role: string
{
    case SuperAdmin = 'super_admin';
    case Owner = 'owner';          // Tenant owner (multi-location)
    case Manager = 'manager';      // Single-location manager
    case Cashier = 'cashier';
    case Waiter = 'waiter';
    case Chef = 'chef';
    case Courier = 'courier';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Owner => 'Egasi',
            self::Manager => 'Menejer',
            self::Cashier => 'Kassir',
            self::Waiter => 'Ofitsiant',
            self::Chef => 'Oshpaz',
            self::Courier => 'Kuryer',
            self::Customer => 'Mijoz',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $r): string => $r->value, self::cases());
    }
}
