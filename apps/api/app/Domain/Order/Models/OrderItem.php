<?php

declare(strict_types=1);

namespace App\Domain\Order\Models;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
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
 */
class OrderItem extends Model
{
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'order_items';

    protected $fillable = [
        'tenant_id', 'order_id', 'menu_item_id',
        'name_snapshot', 'price_amount', 'quantity', 'subtotal_amount', 'currency',
        'modifiers', 'notes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'modifiers' => 'array',
            'price_amount' => 'integer',
            'quantity' => 'integer',
            'subtotal_amount' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}
