<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Actions;

use App\Domain\Inventory\Actions\ConsumeIngredientsForOrderAction;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Persists a kiosk-originated order. The kiosk is authenticated via its device
 * token (no Sanctum user) so all queries explicitly scope by `tenant_id` and
 * bypass {@see App\Domain\Shared\Concerns\BelongsToTenant} global scope.
 */
class PlaceKioskOrderAction
{
    public function __construct(
        private readonly ConsumeIngredientsForOrderAction $consumeIngredients,
    ) {}

    /**
     * @param  array{
     *     session_id?: string|null,
     *     items: array<int, array{menu_item_id: string, quantity: int, notes?: string|null, modifiers?: array<int, array{id: string, name: string, price_delta: int}>}>,
     *     customer_phone_for_receipt?: string|null,
     *     notes?: string|null,
     * }  $input
     */
    public function __invoke(KioskDevice $device, array $input): Order
    {
        if (empty($input['items'])) {
            throw ValidationException::withMessages([
                'items' => [__('Kamida bitta mahsulot tanlash kerak')],
            ]);
        }

        $sessionId = $input['session_id'] ?? (string) Str::uuid();

        $order = DB::transaction(function () use ($device, $input, $sessionId): Order {
            $menuItemIds = collect($input['items'])->pluck('menu_item_id')->unique()->values()->all();

            $menuItems = MenuItem::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $device->tenant_id)
                ->whereIn('id', $menuItemIds)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            if ($menuItems->count() !== count($menuItemIds)) {
                throw ValidationException::withMessages([
                    'items' => [__('Ba\'zi mahsulotlar mavjud emas yoki faol emas')],
                ]);
            }

            /** @var MenuItem $first */
            $first = $menuItems->first();
            $currency = $first->price_currency;
            $subtotal = 0;

            $order = Order::query()->create([
                'tenant_id' => $device->tenant_id,
                'order_no' => $this->generateOrderNo($device->tenant_id),
                'type' => OrderType::Kiosk->value,
                'status' => OrderStatus::Pending->value,
                'payment_status' => 'unpaid',
                'kiosk_device_id' => $device->id,
                'kiosk_session_id' => $sessionId,
                'customer_phone_for_receipt' => $input['customer_phone_for_receipt'] ?? null,
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

                OrderItem::query()->create([
                    'tenant_id' => $device->tenant_id,
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'name_snapshot' => $menuItem->name($device->language ?? 'uz'),
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
                'total_amount' => $subtotal, // TODO: tax/discount/service charge
            ]);

            return $order->load(['items']);
        });

        // Inventory deduction must NOT block order creation.
        try {
            ($this->consumeIngredients)($order);
        } catch (Throwable $e) {
            Log::warning('Kiosk order ingredient deduct failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $order;
    }

    private function generateOrderNo(string $tenantId): string
    {
        $today = now()->format('ymd');
        $prefix = 'K' . $today;

        $todayCount = Order::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('order_no', 'like', $prefix . '%')
            ->count();

        return $prefix . '-' . str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);
    }
}
