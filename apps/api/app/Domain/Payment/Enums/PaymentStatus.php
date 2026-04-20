<?php

declare(strict_types=1);

namespace App\Domain\Payment\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Authorized = 'authorized';
    case Captured = 'captured';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Kutilmoqda',
            self::Authorized => 'Avtorizatsiya qilindi',
            self::Captured => 'Qabul qilindi',
            self::Failed => 'Muvaffaqiyatsiz',
            self::Refunded => 'Qaytarildi',
            self::Cancelled => 'Bekor qilingan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Authorized => 'info',
            self::Captured => 'success',
            self::Failed, self::Cancelled => 'danger',
            self::Refunded => 'gray',
        };
    }

    public function isTerminal(): bool
    {
        return match ($this) {
            self::Captured, self::Failed, self::Refunded, self::Cancelled => true,
            self::Pending, self::Authorized => false,
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
