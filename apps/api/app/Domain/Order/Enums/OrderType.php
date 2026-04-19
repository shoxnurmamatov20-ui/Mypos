<?php

declare(strict_types=1);

namespace App\Domain\Order\Enums;

enum OrderType: string
{
    case DineIn = 'dine_in';
    case Takeaway = 'takeaway';
    case Delivery = 'delivery';
    case Kiosk = 'kiosk';
    case QrMenu = 'qr_menu';
    case Telegram = 'telegram';
    case Marketplace = 'marketplace';

    public function label(): string
    {
        return match ($this) {
            self::DineIn => "Zalda",
            self::Takeaway => "O'zi olib ketish",
            self::Delivery => 'Yetkazib berish',
            self::Kiosk => 'Kiosk',
            self::QrMenu => 'QR Menyu',
            self::Telegram => 'Telegram',
            self::Marketplace => 'Marketplace',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
