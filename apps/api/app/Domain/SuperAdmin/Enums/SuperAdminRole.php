<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Enums;

enum SuperAdminRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Support = 'support';
    case Finance = 'finance';
    case Developer = 'developer';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Admin => 'Admin',
            self::Support => 'Support',
            self::Finance => 'Finance',
            self::Developer => 'Developer',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
