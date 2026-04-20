<?php

declare(strict_types=1);

namespace App\Domain\Order\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
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
 * @property string $type
 * @property string $status
 * @property string $payment_status
 * @property string|null $payment_method
 * @property string|null $table_id
 * @property string|null $customer_id
 * @property string|null $employee_id
 * @property int|null $guest_count
 * @property int $subtotal_amount
 * @property int $tax_amount
 * @property int $discount_amount
 * @property int $tip_amount
 * @property int $service_charge_amount
 * @property int $total_amount
 * @property int $paid_amount
 * @property string $currency
 * @property string|null $notes
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $placed_at
 * @property \Illuminate\Support\Carbon|null $prepared_at
 * @property \Illuminate\Support\Carbon|null $served_at
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $cancelled_at
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
        'tenant_id', 'order_no', 'type', 'status', 'payment_status', 'payment_method',
        'table_id', 'customer_id', 'employee_id', 'guest_count',
        'subtotal_amount', 'tax_amount', 'discount_amount', 'tip_amount',
        'service_charge_amount', 'total_amount', 'paid_amount', 'currency',
        'notes', 'metadata',
        'placed_at', 'prepared_at', 'served_at', 'paid_at', 'completed_at', 'cancelled_at',
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
            'placed_at' => 'datetime',
            'prepared_at' => 'datetime',
            'served_at' => 'datetime',
            'paid_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
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

    protected static function newFactory(): OrderFactory
    {
        return OrderFactory::new();
    }
}
