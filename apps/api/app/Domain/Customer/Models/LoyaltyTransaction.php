<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $account_id
 * @property string|null $order_id
 * @property int $delta
 * @property int $balance_after
 * @property string $reason
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 */
class LoyaltyTransaction extends Model
{
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'loyalty_transactions';

    /** No updated_at on this ledger table. */
    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'account_id',
        'order_id',
        'delta',
        'balance_after',
        'reason',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'delta' => 'integer',
            'balance_after' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(LoyaltyAccount::class, 'account_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
