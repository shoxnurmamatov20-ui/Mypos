<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $order_id
 * @property string|null $customer_id
 * @property int $rating
 * @property int|null $food_rating
 * @property int|null $delivery_rating
 * @property string|null $comment
 * @property-read Tenant|null $tenant
 * @property-read Order|null $order
 * @property-read Customer|null $customer
 */
class OrderReview extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'order_id',
        'customer_id',
        'rating',
        'food_rating',
        'delivery_rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'food_rating' => 'integer',
            'delivery_rating' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
