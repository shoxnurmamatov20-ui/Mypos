<?php

declare(strict_types=1);

namespace App\Domain\Employee\Enums;

/**
 * Reasons a courier may cancel an in-progress delivery.
 *
 * Stored under `orders.metadata.delivery_cancel_reason` for analytics.
 */
enum DeliveryCancelReason: string
{
    case CustomerUnavailable = 'customer_unavailable';
    case WrongAddress = 'wrong_address';
    case VehicleBreakdown = 'vehicle_breakdown';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::CustomerUnavailable => 'Mijoz mavjud emas',
            self::WrongAddress => "Manzil noto'g'ri",
            self::VehicleBreakdown => 'Transport buzildi',
            self::Other => 'Boshqa',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
