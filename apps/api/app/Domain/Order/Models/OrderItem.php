<?php

declare(strict_types=1);

namespace App\Domain\Order\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $order_id
 * @property string|null $menu_item_id
 * @property string $name_snapshot
 * @property int $price_amount
 * @property int $quantity
 * @property int $subtotal_amount
 * @property string $currency
 * @property array<int, array<string, mixed>>|null $modifiers
 * @property string|null $notes
 * @property string $status
 * @property string|null $cook_id
 * @property \Illuminate\Support\Carbon|null $started_preparing_at
 * @property \Illuminate\Support\Carbon|null $ready_at
 * @property int|null $prep_duration_seconds
 */
class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'order_items';

    protected $fillable = [
        'tenant_id', 'order_id', 'menu_item_id',
        'name_snapshot', 'price_amount', 'quantity', 'subtotal_amount', 'currency',
        'modifiers', 'notes', 'status',
        'cook_id', 'started_preparing_at', 'ready_at', 'prep_duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'modifiers' => 'array',
            'price_amount' => 'integer',
            'quantity' => 'integer',
            'subtotal_amount' => 'integer',
            'started_preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'prep_duration_seconds' => 'integer',
        ];
    }

    public function cook(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'cook_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }

    protected static function newFactory(): OrderItemFactory
    {
        return OrderItemFactory::new();
    }
}
