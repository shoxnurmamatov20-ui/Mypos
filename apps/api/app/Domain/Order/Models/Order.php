<?php

declare(strict_types=1);

namespace App\Domain\Order\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Casts\MoneyCast;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Shared\Services\FxRateService;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Table\Models\Table;
use App\Models\User;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $order_no
 * @property string|null $tracking_token
 * @property string $type
 * @property string $status
 * @property string $payment_status
 * @property string|null $payment_method
 * @property string|null $table_id
 * @property string|null $customer_id
 * @property string|null $employee_id
 * @property string|null $served_by_id
 * @property string|null $courier_id
 * @property int|null $guest_count
 * @property int $subtotal_amount
 * @property int $tax_amount
 * @property int $discount_amount
 * @property int $tip_amount
 * @property int $service_charge_amount
 * @property int $total_amount
 * @property int $paid_amount
 * @property string $currency
 * @property string $currency_code           Phase-4 normalised FK → currencies.code
 * @property string|null $notes
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $placed_at
 * @property \Illuminate\Support\Carbon|null $prepared_at
 * @property \Illuminate\Support\Carbon|null $served_at
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property \Illuminate\Support\Carbon|null $picked_up_at
 * @property \Illuminate\Support\Carbon|null $delivering_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 * @property int|null $delivery_distance_meters
 * @property int|null $delivery_fee_minor
 * @property int|null $courier_earnings_minor
 * @property array<string, mixed>|null $delivery_address
 * @property string|null $delivery_phone
 * @property string|null $delivery_notes
 * @property string|null $kiosk_device_id
 * @property string|null $kiosk_session_id
 * @property string|null $customer_phone_for_receipt
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'orders';

    protected $fillable = [
        'tenant_id', 'order_no', 'tracking_token', 'type', 'status', 'payment_status', 'payment_method',
        'table_id', 'customer_id', 'employee_id', 'served_by_id', 'courier_id',
        'guest_count',
        'subtotal_amount', 'tax_amount', 'discount_amount', 'tip_amount',
        'service_charge_amount', 'total_amount', 'paid_amount', 'currency', 'currency_code',
        'notes', 'metadata',
        'placed_at', 'prepared_at', 'served_at', 'paid_at', 'completed_at', 'cancelled_at',
        'picked_up_at', 'delivering_at', 'delivered_at',
        'delivery_distance_meters', 'delivery_fee_minor', 'courier_earnings_minor',
        'delivery_address', 'delivery_phone', 'delivery_notes',
        'kiosk_device_id', 'kiosk_session_id', 'customer_phone_for_receipt',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'subtotal_amount' => 'integer',
            'tax_amount' => 'integer',
            'discount_amount' => 'integer',
            'tip_amount' => 'integer',
            'service_charge_amount' => 'integer',
            'total_amount' => 'integer',
            'paid_amount' => 'integer',
            'guest_count' => 'integer',

            // Phase 4 — virtual Money attributes. The cast key is NOT a
            // real DB column; it pairs the underlying *_amount + currency_code
            // columns into a single immutable Money value object on read.
            // Existing reads of `$order->total_amount` (raw int) still work
            // — the cast only kicks in for the virtual `total_money` etc.
            'total_money' => MoneyCast::class . ':total_amount,currency_code',
            'subtotal_money' => MoneyCast::class . ':subtotal_amount,currency_code',
            'tax_money' => MoneyCast::class . ':tax_amount,currency_code',
            'discount_money' => MoneyCast::class . ':discount_amount,currency_code',
            'tip_money' => MoneyCast::class . ':tip_amount,currency_code',
            'service_charge_money' => MoneyCast::class . ':service_charge_amount,currency_code',
            'paid_money' => MoneyCast::class . ':paid_amount,currency_code',
            'placed_at' => 'datetime',
            'prepared_at' => 'datetime',
            'served_at' => 'datetime',
            'paid_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivering_at' => 'datetime',
            'delivered_at' => 'datetime',
            'delivery_distance_meters' => 'integer',
            'delivery_fee_minor' => 'integer',
            'courier_earnings_minor' => 'integer',
            // PII (CLAUDE.md §7) — Crypt:: at rest. delivery_address holds
            // street/apartment/lat-lng/notes, so JSON encrypt-to-array.
            'delivery_address' => 'encrypted:array',
            'delivery_phone' => 'encrypted',
            'delivery_notes' => 'encrypted',
            'customer_phone_for_receipt' => 'encrypted',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class, 'table_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'served_by_id');
    }

    public function courier(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'courier_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Customer\Models\Customer::class, 'customer_id');
    }

    public function kioskDevice(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Kiosk\Models\KioskDevice::class, 'kiosk_device_id');
    }

    // -----------------------------------------------------------------
    // Phase 4 — currency-aware Money helpers
    // -----------------------------------------------------------------

    /**
     * Resolve the order's effective currency code. Prefers the Phase-4
     * normalised `currency_code` (char(3) FK to currencies.code), falls
     * back to the legacy free-text `currency` column, and finally to UZS
     * for very old grandfathered rows that predate any currency column.
     *
     * Always uppercase, always 3 chars — safe to pass to {@see Money}
     * constructors without further sanitisation.
     */
    public function effectiveCurrency(): string
    {
        $code = strtoupper((string) ($this->currency_code ?: $this->currency ?: 'UZS'));
        return preg_match('/^[A-Z]{3}$/', $code) === 1 ? $code : 'UZS';
    }

    /**
     * The order total as a {@see Money} value object. Use this for any
     * arithmetic, comparison, or formatting — never operate on the raw
     * integer amounts directly.
     */
    public function total(): Money
    {
        return Money::fromMinor((int) $this->total_amount, $this->effectiveCurrency());
    }

    public function subtotal(): Money
    {
        return Money::fromMinor((int) $this->subtotal_amount, $this->effectiveCurrency());
    }

    public function tax(): Money
    {
        return Money::fromMinor((int) $this->tax_amount, $this->effectiveCurrency());
    }

    public function discount(): Money
    {
        return Money::fromMinor((int) $this->discount_amount, $this->effectiveCurrency());
    }

    public function tip(): Money
    {
        return Money::fromMinor((int) $this->tip_amount, $this->effectiveCurrency());
    }

    public function serviceCharge(): Money
    {
        return Money::fromMinor((int) $this->service_charge_amount, $this->effectiveCurrency());
    }

    public function paid(): Money
    {
        return Money::fromMinor((int) $this->paid_amount, $this->effectiveCurrency());
    }

    /**
     * Convert the order's total into another currency at the rate effective
     * on the order's `placed_at` date — not today's rate. Receipts must be
     * stable: a kebab ordered last Tuesday should still show the same
     * USD-equivalent on the printed copy a month later.
     *
     * For real-time displays (e.g. dashboard cards rendered to a roaming
     * super admin), pass `now()` explicitly.
     */
    public function convertTotalTo(string $currency, FxRateService $fx): Money
    {
        return $fx->convert($this->total(), $currency, $this->placed_at);
    }

    protected static function newFactory(): OrderFactory
    {
        return OrderFactory::new();
    }
}
