<?php

declare(strict_types=1);

namespace App\Domain\Order\Enums;

enum OrderStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';         // submitted, waiting to be prepared
    case Preparing = 'preparing';     // kitchen started
    case Ready = 'ready';             // ready to serve
    case Served = 'served';           // delivered to table
    case Completed = 'completed';     // paid and closed
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Qoralama',
            self::Pending => 'Kutilmoqda',
            self::Preparing => 'Tayyorlanmoqda',
            self::Ready => 'Tayyor',
            self::Served => 'Beriladi',
            self::Completed => 'Yakunlangan',
            self::Cancelled => 'Bekor qilingan',
            self::Refunded => 'Qaytarildi',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Pending => 'warning',
            self::Preparing => 'info',
            self::Ready => 'success',
            self::Served => 'primary',
            self::Completed => 'gray',
            self::Cancelled, self::Refunded => 'danger',
        };
    }

    /**
     * Allowed next states from the current one.
     * @return array<OrderStatus>
     */
    public function nextAllowed(): array
    {
        return match ($this) {
            self::Draft => [self::Pending, self::Cancelled],
            self::Pending => [self::Preparing, self::Cancelled],
            self::Preparing => [self::Ready, self::Cancelled],
            self::Ready => [self::Served, self::Cancelled],
            self::Served => [self::Completed, self::Cancelled],
            self::Completed => [self::Refunded],
            self::Cancelled, self::Refunded => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->nextAllowed(), true);
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
