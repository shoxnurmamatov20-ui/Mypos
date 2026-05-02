<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Enums;

enum AuditSeverity: string
{
    case Debug = 'debug';
    case Info = 'info';
    case Warning = 'warning';
    case Error = 'error';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Debug => 'Debug',
            self::Info => 'Info',
            self::Warning => 'Warning',
            self::Error => 'Error',
            self::Critical => 'Critical',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
