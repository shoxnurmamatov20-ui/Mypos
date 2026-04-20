<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Table\Models\Table;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Order\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public (unauthenticated) order placement from QR-scan PWA.
 *
 * Order is strictly tied to (tenant_slug, table_id). Menu items are
 * verified against the tenant. Type is fixed to qr_menu.
 */
class PublicOrderController extends Controller
{
    public function store(Request $request, string $slug): JsonResponse
    {
        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->whereNull('suspended_at')
            ->first();

        if ($tenant === null) {
            throw new NotFoundHttpException("Restoran topilmadi");
        }

        $validated = $request->validate([
            'table_id' => ['required', 'uuid'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.menu_item_id' => ['required', 'uuid'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
        ]);

        $table = Table::query()
            ->withoutGlobalScope('tenant')
            ->where('id', $validated['table_id'])
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($table === null) {
            throw ValidationException::withMessages([
                'table_id' => ["Stol topilmadi"],
            ]);
        }

        $order = DB::transaction(function () use ($tenant, $validated, $table): Order {
            $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique()->values()->all();

            $menuItems = MenuItem::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
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

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'order_no' => $this->generateOrderNo($tenant->id),
                'type' => OrderType::QrMenu->value,
                'status' => OrderStatus::Pending->value,
                'payment_status' => 'unpaid',
                'table_id' => $table->id,
                'currency' => $currency,
                'notes' => $validated['notes'] ?? null,
                'placed_at' => now(),
            ]);

            foreach ($validated['items'] as $line) {
                /** @var MenuItem $menuItem */
                $menuItem = $menuItems[$line['menu_item_id']];
                $qty = max(1, (int) $line['quantity']);
                $unitPrice = $menuItem->effectivePrice();
                $lineSubtotal = $unitPrice * $qty;
                $subtotal += $lineSubtotal;

                OrderItem::query()->create([
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'name_snapshot' => $menuItem->name($tenant->default_locale),
                    'price_amount' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal_amount' => $lineSubtotal,
                    'currency' => $currency,
                    'notes' => $line['notes'] ?? null,
                    'status' => OrderStatus::Pending->value,
                ]);
            }

            $order->update([
                'subtotal_amount' => $subtotal,
                'total_amount' => $subtotal,
            ]);

            Table::query()
                ->withoutGlobalScope('tenant')
                ->where('id', $table->id)
                ->update(['status' => 'occupied']);

            return $order->load(['items', 'table']);
        });

        return response()->json(
            ['data' => OrderResource::make($order)],
            201,
        );
    }

    private function generateOrderNo(string $tenantId): string
    {
        $today = now()->format('ymd');
        $prefix = 'Q' . $today;

        $todayCount = Order::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('order_no', 'like', $prefix . '%')
            ->count();

        return $prefix . '-' . str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);
    }
}
