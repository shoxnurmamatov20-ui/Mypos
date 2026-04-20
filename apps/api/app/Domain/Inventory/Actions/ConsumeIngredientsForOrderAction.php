<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Recipe;
use App\Domain\Order\Models\Order;

/**
 * Walks each OrderItem, loads its Recipes, and records negative stock movements
 * for every required ingredient. If no recipe exists for a menu item it is
 * simply skipped (not an error) — recipes are optional.
 */
class ConsumeIngredientsForOrderAction
{
    public function __construct(
        private readonly AdjustStockAction $adjustStock,
    ) {}

    public function __invoke(Order $order): void
    {
        $order->loadMissing('items');

        $menuItemQuantities = [];
        foreach ($order->items as $item) {
            if ($item->menu_item_id === null) {
                continue;
            }
            $key = $item->menu_item_id;
            $menuItemQuantities[$key] = ($menuItemQuantities[$key] ?? 0) + (int) $item->quantity;
        }

        if ($menuItemQuantities === []) {
            return;
        }

        $recipes = Recipe::query()
            ->whereIn('menu_item_id', array_keys($menuItemQuantities))
            ->where('is_optional', false)
            ->get();

        if ($recipes->isEmpty()) {
            return;
        }

        foreach ($recipes as $recipe) {
            $orderQty = $menuItemQuantities[$recipe->menu_item_id] ?? 0;
            if ($orderQty <= 0) {
                continue;
            }

            $consumeQty = (float) $recipe->quantity * $orderQty;
            if ($consumeQty <= 0) {
                continue;
            }

            ($this->adjustStock)([
                'ingredient_id' => $recipe->ingredient_id,
                'delta' => -$consumeQty,
                'reason' => StockMovementReason::OrderConsume->value,
                'reference_type' => 'order',
                'reference_id' => $order->id,
                'notes' => "Order #{$order->order_no}",
            ]);
        }
    }
}
