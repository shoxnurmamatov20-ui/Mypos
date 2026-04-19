<?php

declare(strict_types=1);

namespace App\Domain\Order\Actions;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Table\Models\Table;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    /**
     * @param array{
     *   type: string,
     *   table_id?: string|null,
     *   employee_uuid?: string|null,
     *   guest_count?: int|null,
     *   notes?: string|null,
     *   items: array<int, array{menu_item_id: string, quantity: int, notes?: string|null, modifiers?: array<int, array{id: string, name: string, price_delta: int}>}>,
     * } $input
     */
    public function __invoke(User $actor, array $input): Order
    {
        if (empty($input['items'])) {
            throw ValidationException::withMessages([
                'items' => ["Kamida bitta mahsulot tanlash kerak"],
            ]);
        }

        return DB::transaction(function () use ($actor, $input): Order {
            // Load menu items in bulk for price/name snapshots (tenant-scoped via Global Scope)
            $menuItemIds = collect($input['items'])->pluck('menu_item_id')->unique()->values()->all();
            $menuItems = MenuItem::query()
                ->whereIn('id', $menuItemIds)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            if ($menuItems->count() !== count($menuItemIds)) {
                throw ValidationException::withMessages([
                    'items' => ["Ba'zi mahsulotlar mavjud emas yoki faol emas"],
                ]);
            }

            $currency = $menuItems->first()->price_currency;
            $subtotal = 0;

            $order = Order::create([
                'order_no' => $this->generateOrderNo($actor->tenant_id),
                'type' => $input['type'] ?? OrderType::DineIn->value,
                'status' => OrderStatus::Pending->value,
                'payment_status' => 'unpaid',
                'table_id' => $input['table_id'] ?? null,
                'employee_id' => $actor->uuid,
                'guest_count' => $input['guest_count'] ?? null,
                'currency' => $currency,
                'notes' => $input['notes'] ?? null,
                'placed_at' => now(),
            ]);

            foreach ($input['items'] as $line) {
                /** @var MenuItem $menuItem */
                $menuItem = $menuItems[$line['menu_item_id']];
                $qty = max(1, (int) $line['quantity']);

                $modifiers = $line['modifiers'] ?? [];
                $modifierSum = collect($modifiers)->sum('price_delta');

                $unitPrice = $menuItem->effectivePrice() + $modifierSum;
                $lineSubtotal = $unitPrice * $qty;
                $subtotal += $lineSubtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'name_snapshot' => $menuItem->name('uz'),
                    'price_amount' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal_amount' => $lineSubtotal,
                    'currency' => $currency,
                    'modifiers' => $modifiers !== [] ? $modifiers : null,
                    'notes' => $line['notes'] ?? null,
                    'status' => OrderStatus::Pending->value,
                ]);
            }

            $order->update([
                'subtotal_amount' => $subtotal,
                'total_amount' => $subtotal, // TODO: apply tax + discount + service charge
            ]);

            // Occupy table if dine-in
            if (!empty($input['table_id'])) {
                Table::query()
                    ->where('id', $input['table_id'])
                    ->update(['status' => 'occupied']);
            }

            return $order->load(['items', 'table']);
        });
    }

    private function generateOrderNo(string $tenantId): string
    {
        $today = now()->format('ymd');
        $prefix = 'O' . $today;

        $todayCount = Order::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('order_no', 'like', $prefix . '%')
            ->count();

        return $prefix . '-' . str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);
    }
}
