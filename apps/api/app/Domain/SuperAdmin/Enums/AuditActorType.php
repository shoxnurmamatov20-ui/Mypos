<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Enums;

enum AuditActorType: string
{
    case User = 'user';
    case SuperAdmin = 'super_admin';
    case System = 'system';
    case Api = 'api';

    public function label(): string
    {
        return match ($this) {
            self::User => 'User',
            self::SuperAdmin => 'Super admin',
            self::System => 'System',
            self::Api => 'API',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
