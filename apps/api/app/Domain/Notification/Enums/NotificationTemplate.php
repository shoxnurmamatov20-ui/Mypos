<?php

declare(strict_types=1);

namespace App\Domain\Notification\Enums;

enum NotificationTemplate: string
{
    case OrderPlaced = 'order_placed';
    case OrderReady = 'order_ready';
    case OrderCancelled = 'order_cancelled';
    case LowStockAlert = 'low_stock_alert';
    case ShiftReminder = 'shift_reminder';
    case WelcomeMessage = 'welcome_message';

    public function subject(): string
    {
        return match ($this) {
            self::OrderPlaced => "Buyurtma qabul qilindi #{order_no}",
            self::OrderReady => "Buyurtmangiz tayyor #{order_no}",
            self::OrderCancelled => "Buyurtma bekor qilindi #{order_no}",
            self::LowStockAlert => 'Ombor ogohlantirishi: {item_name}',
            self::ShiftReminder => 'Smena eslatmasi',
            self::WelcomeMessage => 'MyPOS ga xush kelibsiz!',
        };
    }

    /**
     * Default body template. Placeholders: {order_no}, {customer_name},
     * {total}, {item_name}, {stock_level}, {shift_start}, {tenant_name}.
     */
    public function bodyTemplate(): string
    {
        return match ($this) {
            self::OrderPlaced => "Assalomu alaykum {customer_name}!\n"
                . "Buyurtmangiz #{order_no} muvaffaqiyatli qabul qilindi.\n"
                . "Umumiy summa: {total}.",
            self::OrderReady => "Salom {customer_name}, buyurtmangiz #{order_no} tayyor.",
            self::OrderCancelled => "Salom {customer_name}, buyurtma #{order_no} bekor qilindi.",
            self::LowStockAlert => "Ogohlantirish: {item_name} zaxirasi juda kam ({stock_level}).",
            self::ShiftReminder => "Smenangiz {shift_start} da boshlanadi.",
            self::WelcomeMessage => "Salom {customer_name}, {tenant_name} ga xush kelibsiz!",
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
