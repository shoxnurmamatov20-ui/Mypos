<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Real-time list of in-flight deliveries.
 *
 * "Active delivery" = orders.type='delivery' AND status='ready' AND
 * delivered_at IS NULL AND cancelled_at IS NULL. The badge in the
 * `pickup_status` column tracks the courier-side lifecycle:
 *   - Awaiting  → no courier assigned
 *   - Pickup    → courier assigned, hasn't picked up yet
 *   - Delivering → en route to customer
 *
 * The widget refreshes via Echo broadcast events on the
 * `tenant.{id}.dashboard` private channel — see {@see self::getListeners()}.
 * If the delivery columns aren't migrated yet, it falls back to a simple
 * status filter so the panel doesn't blow up.
 */
class ActiveDeliveriesWidget extends TableWidget
{
    protected static ?string $heading = 'Hozirgi yetkazmalar';

    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = 4;

    /**
     * Polling removed (audit H4) — refreshed via Echo broadcast events.
     * Agent B3 fires `delivery.assigned`, `delivery.picked_up`,
     * `delivery.delivered` on the dashboard channel.
     */
    protected static ?string $pollingInterval = null;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.delivery.assigned" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.delivery.picked_up" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.delivery.delivered" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.order.placed" => '$refresh',
        ];
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(self::query())
            ->defaultSort('created_at', 'asc')
            ->columns([
                Tables\Columns\TextColumn::make('order_no')
                    ->label('Buyurtma')
                    ->formatStateUsing(fn (?string $state): string => $state !== null ? '#' . $state : '—')
                    ->weight('semibold')
                    ->searchable(),
                Tables\Columns\TextColumn::make('courier_name')
                    ->label('Kuryer')
                    ->state(fn (Order $record): string => self::courierName($record))
                    ->badge()
                    ->color(fn (Order $record): string => self::courierAttr($record) !== null
                        ? 'info'
                        : 'gray'),
                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Mijoz')
                    ->state(fn (Order $record): string => self::customerName($record))
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('pickup_status')
                    ->label('Holati')
                    ->state(fn (Order $record): string => self::pickupStatusLabel($record))
                    ->badge()
                    ->color(fn (Order $record): string => self::pickupStatusColor($record)),
                Tables\Columns\TextColumn::make('total_amount')
                    ->label('Summa')
                    ->state(fn (Order $record): string => self::formatTotal($record))
                    ->color('primary'),
                Tables\Columns\TextColumn::make('delivery_address')
                    ->label('Manzil')
                    ->state(fn (Order $record): string => self::deliveryStreet($record))
                    ->wrap()
                    ->placeholder('—')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('delivery_phone')
                    ->label('Telefon')
                    ->state(fn (Order $record): string => self::deliveryPhone($record))
                    ->copyable()
                    ->placeholder('—')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratildi')
                    ->since()
                    ->sortable(),
            ])
            ->paginated([5, 10, 25])
            ->emptyStateHeading('Hozir faol yetkazma yoq')
            ->emptyStateDescription("Yangi 'delivery' buyurtmalari shu yerda paydo bo'ladi");
    }

    /** @return Builder<Order> */
    protected static function query(): Builder
    {
        // Audit H2: eager-load `courier.user` so the courier name column
        // doesn't fan out to (Employee + User) per row. Order::courier()
        // points at Employee; the User behind the Employee is reached via
        // `Employee::user()`.
        $query = Order::query()
            ->with([
                'courier:id,user_uuid,employee_code',
                'courier.user:uuid,name',
            ])
            ->where('type', OrderType::Delivery->value)
            ->where('status', OrderStatus::Ready->value)
            ->whereNull('cancelled_at');

        if (Schema::hasColumn('orders', 'delivered_at')) {
            $query->whereNull('delivered_at');
        }

        return $query;
    }

    private static function courierName(Order $order): string
    {
        // Audit H2: read the eager-loaded `courier` relation instead of
        // issuing a fresh `Employee::find()` per row. The relation may be
        // null if `courier_id` is null OR if the Employee row was deleted.
        if (self::courierAttr($order) === null) {
            return '—';
        }
        $courier = $order->relationLoaded('courier') ? $order->courier : null;
        if ($courier === null) {
            return '—';
        }
        $name = $courier->relationLoaded('user') && $courier->user !== null
            ? trim((string) $courier->user->name)
            : '';
        if ($name !== '') {
            return $name;
        }
        $code = (string) ($courier->employee_code ?? '');
        return $code !== '' ? '#' . $code : '—';
    }

    private static function courierAttr(Order $order): ?string
    {
        // Defensive: column added by parallel migration.
        if (! array_key_exists('courier_id', $order->getAttributes())) {
            return null;
        }
        $value = $order->getAttribute('courier_id');
        return is_string($value) && $value !== '' ? $value : null;
    }

    private static function customerName(Order $order): string
    {
        $address = self::deliveryAddress($order);
        if (is_array($address) && isset($address['name']) && is_string($address['name'])) {
            $name = trim($address['name']);
            if ($name !== '') {
                return $name;
            }
        }
        return '—';
    }

    private static function deliveryStreet(Order $order): string
    {
        $address = self::deliveryAddress($order);
        if (! is_array($address)) {
            return '—';
        }
        $street = isset($address['street']) && is_string($address['street'])
            ? trim($address['street'])
            : '';
        return $street !== '' ? $street : '—';
    }

    private static function deliveryPhone(Order $order): string
    {
        if (array_key_exists('delivery_phone', $order->getAttributes())) {
            $phone = $order->getAttribute('delivery_phone');
            if (is_string($phone) && trim($phone) !== '') {
                return $phone;
            }
        }
        $address = self::deliveryAddress($order);
        if (is_array($address) && isset($address['phone']) && is_string($address['phone'])) {
            return $address['phone'];
        }
        return '—';
    }

    /** @return array<string, mixed>|null */
    private static function deliveryAddress(Order $order): ?array
    {
        if (! array_key_exists('delivery_address', $order->getAttributes())) {
            return null;
        }
        $raw = $order->getAttribute('delivery_address');
        if (is_array($raw)) {
            return $raw;
        }
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : null;
        }
        return null;
    }

    private static function pickupStatusLabel(Order $order): string
    {
        $courierId = self::courierAttr($order);
        $pickedUp = self::timestampAttr($order, 'picked_up_at');

        if ($courierId === null && $pickedUp === null) {
            return 'Tayinlanmagan';
        }
        if ($courierId !== null && $pickedUp === null) {
            return 'Olishga ketdi';
        }
        return 'Yetkazmoqda';
    }

    private static function pickupStatusColor(Order $order): string
    {
        $courierId = self::courierAttr($order);
        $pickedUp = self::timestampAttr($order, 'picked_up_at');

        if ($courierId === null && $pickedUp === null) {
            return 'warning';
        }
        if ($courierId !== null && $pickedUp === null) {
            return 'info';
        }
        return 'success';
    }

    private static function timestampAttr(Order $order, string $attribute): ?string
    {
        if (! array_key_exists($attribute, $order->getAttributes())) {
            return null;
        }
        $value = $order->getAttribute($attribute);
        if ($value === null) {
            return null;
        }
        return (string) $value;
    }

    private static function formatTotal(Order $order): string
    {
        $minor = (int) ($order->total_amount ?? 0);
        $som = (int) round($minor / 100);
        return number_format($som, 0, '.', ' ') . " so'm";
    }
}
