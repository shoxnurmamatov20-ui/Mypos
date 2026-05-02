<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Payment\Actions\CreatePaymentIntentAction;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Table\Models\Table;
use App\Domain\Tenant\Models\Tenant;
use App\Events\Order\OrderPlaced;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Public\CreatePublicOrderRequest;
use App\Http\Resources\V1\Order\OrderResource;
use App\Http\Resources\V1\Public\PublicOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public (unauthenticated) order endpoints:
 *
 *   - POST /api/v1/public/orders                  — marketplace guest checkout
 *   - GET  /api/v1/public/orders/track/{token}    — guest order tracker
 *   - POST /api/v1/public/menu/{slug}/orders      — legacy QR-menu PWA
 *
 * Each marketplace order is issued an unguessable `tracking_token` (UUID v4)
 * stored on the row. The token IS the credential — never expose `order_no`
 * or internal IDs to the consumer.
 *
 * Multi-tenant safety: tenant is resolved exclusively from `restaurant_slug`
 * (or `{slug}` URL param for QR menu). Menu items are re-validated against
 * the resolved tenant — passing items from a *different* tenant is rejected.
 */
class PublicOrderController extends Controller
{
    public function __construct(
        private readonly CreatePaymentIntentAction $createPaymentIntent,
    ) {}

    /**
     * Marketplace guest checkout (web-consumer / mobile-consumer).
     *
     * Body shape (validated by CreatePublicOrderRequest):
     *   restaurant_slug, items[{menu_item_id, qty, modifiers?}],
     *   customer{phone, name?},
     *   delivery{is_pickup?, address?, lat?, lng?, notes?},
     *   payment_method (cash|click|payme).
     */
    public function store(CreatePublicOrderRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $tenant = $this->resolveTenant((string) $payload['restaurant_slug']);

        $isPickup = (bool) ($payload['delivery']['is_pickup'] ?? false);
        $paymentMethod = PaymentProvider::from((string) $payload['payment_method']);

        $order = DB::transaction(function () use ($tenant, $payload, $isPickup, $paymentMethod): Order {
            $menuItems = $this->loadMenuItemsForTenant(
                tenantId: (string) $tenant->id,
                ids: collect($payload['items'])->pluck('menu_item_id')->unique()->values()->all(),
            );

            $currency = $menuItems->first()->price_currency;
            $subtotal = 0;

            $deliveryAddress = null;
            if (! $isPickup) {
                $deliveryAddress = [
                    'address' => (string) ($payload['delivery']['address'] ?? ''),
                    'lat' => isset($payload['delivery']['lat']) ? (float) $payload['delivery']['lat'] : null,
                    'lng' => isset($payload['delivery']['lng']) ? (float) $payload['delivery']['lng'] : null,
                    'customer_name' => $payload['customer']['name'] ?? null,
                ];
            }

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'order_no' => $this->generateOrderNo((string) $tenant->id, prefix: 'M'),
                'tracking_token' => (string) Str::uuid(),
                'type' => OrderType::Marketplace->value,
                'status' => OrderStatus::Pending->value,
                'payment_status' => $paymentMethod === PaymentProvider::Cash ? 'unpaid' : 'pending_payment',
                'payment_method' => $paymentMethod->value,
                'currency' => $currency,
                'notes' => $payload['order_notes'] ?? null,
                'placed_at' => now(),
                'delivery_phone' => (string) $payload['customer']['phone'],
                'delivery_address' => $deliveryAddress,
                'delivery_notes' => $payload['delivery']['notes'] ?? null,
                'customer_phone_for_receipt' => (string) $payload['customer']['phone'],
                'metadata' => [
                    'is_pickup' => $isPickup,
                    'guest_name' => $payload['customer']['name'] ?? null,
                ],
            ]);

            foreach ($payload['items'] as $line) {
                /** @var MenuItem $menuItem */
                $menuItem = $menuItems[$line['menu_item_id']];
                $qty = max(1, (int) $line['qty']);

                $modifiers = $line['modifiers'] ?? [];
                $modifierSum = collect($modifiers)->sum('price_delta');
                $unitPrice = $menuItem->effectivePrice() + (int) $modifierSum;
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
                    'modifiers' => $modifiers !== [] ? $modifiers : null,
                    'notes' => $line['notes'] ?? null,
                    'status' => OrderStatus::Pending->value,
                ]);
            }

            $order->update([
                'subtotal_amount' => $subtotal,
                'total_amount' => $subtotal, // TODO: tax + delivery fee + service charge
            ]);

            return $order->load(['items']);
        });

        // Broadcast to KDS + dashboard (Reverb private channels). Non-fatal.
        OrderPlaced::dispatch($order);

        $response = [
            'order_id' => $order->id,
            'tracking_token' => $order->tracking_token,
            'status' => $order->status,
            'payment_method' => $order->payment_method,
            'amounts' => [
                'subtotal' => $order->subtotal_amount,
                'total' => $order->total_amount,
                'currency' => $order->currency,
            ],
        ];

        // For gateway-style payments, immediately mint a payment intent so
        // the consumer can be redirected to Click/Payme.
        if ($paymentMethod->isGateway()) {
            $intent = ($this->createPaymentIntent)($order, $paymentMethod);
            $response['payment'] = [
                'provider' => $paymentMethod->value,
                'intent_id' => $intent['payment']->id,
                'url' => $intent['payment_url'],
                'transaction_id' => $intent['transaction_id'],
            ];
        }

        return response()->json(['data' => $response], 201);
    }

    /**
     * Token-based public order tracker. The token is opaque and lives only
     * on the order row — auth is the token, no further checks needed.
     */
    public function track(Request $request, string $token): JsonResponse
    {
        if (strlen($token) > 64 || ! preg_match('/^[a-zA-Z0-9-]+$/', $token)) {
            // Reject malformed tokens up front to avoid wasting a DB hit.
            throw new NotFoundHttpException('Buyurtma topilmadi');
        }

        $order = Order::query()
            ->withoutGlobalScopes()
            ->with(['items', 'tenant'])
            ->where('tracking_token', $token)
            ->first();

        if ($order === null) {
            throw new NotFoundHttpException('Buyurtma topilmadi');
        }

        return response()->json([
            'data' => PublicOrderResource::make($order)->toArray($request),
        ]);
    }

    /**
     * Legacy QR-menu PWA flow. Tenant resolved from URL slug, table_id
     * required. Kept here so existing QR clients keep working unchanged.
     */
    public function storeForQrMenu(Request $request, string $slug): JsonResponse
    {
        $tenant = $this->resolveTenant($slug);

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
                'table_id' => ['Stol topilmadi'],
            ]);
        }

        $order = DB::transaction(function () use ($tenant, $validated, $table): Order {
            $menuItems = $this->loadMenuItemsForTenant(
                tenantId: (string) $tenant->id,
                ids: collect($validated['items'])->pluck('menu_item_id')->unique()->values()->all(),
            );

            $currency = $menuItems->first()->price_currency;
            $subtotal = 0;

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'order_no' => $this->generateOrderNo((string) $tenant->id, prefix: 'Q'),
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

        OrderPlaced::dispatch($order);

        return response()->json(
            ['data' => OrderResource::make($order)],
            201,
        );
    }

    private function resolveTenant(string $slug): Tenant
    {
        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->whereNull('suspended_at')
            ->first();

        if ($tenant === null) {
            throw new NotFoundHttpException('Restoran topilmadi');
        }

        return $tenant;
    }

    /**
     * @param  array<int, string>  $ids
     * @return \Illuminate\Support\Collection<string, MenuItem>
     */
    private function loadMenuItemsForTenant(string $tenantId, array $ids): \Illuminate\Support\Collection
    {
        $menuItems = MenuItem::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $ids)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== count($ids)) {
            throw ValidationException::withMessages([
                'items' => ["Ba'zi mahsulotlar mavjud emas yoki faol emas"],
            ]);
        }

        return $menuItems;
    }

    private function generateOrderNo(string $tenantId, string $prefix = 'M'): string
    {
        $today = now()->format('ymd');
        $base = $prefix . $today;

        $count = Order::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('order_no', 'like', $base . '%')
            ->count();

        return $base . '-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }
}
