<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Enums;

enum StockMovementReason: string
{
    case OrderConsume = 'order_consume';
    case Purchase = 'purchase';
    case Adjustment = 'adjust';
    case Waste = 'waste';
    case Transfer = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::OrderConsume => 'Buyurtma hisobiga',
            self::Purchase => 'Xarid',
            self::Adjustment => 'Tuzatish',
            self::Waste => 'Yo\'qotish',
            self::Transfer => 'Ko\'chirish',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::OrderConsume => 'gray',
            self::Purchase => 'success',
            self::Adjustment => 'warning',
            self::Waste => 'danger',
            self::Transfer => 'info',
        };
    }

    /** @return array<string> */
    public static function values(): array
    {
        return array_map(fn (self $c): string => $c->value, self::cases());
    }
}
