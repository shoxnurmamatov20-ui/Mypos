<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $customer_id
 * @property string $program_id
 * @property string $tier
 * @property int $points_balance
 * @property int $lifetime_points
 */
class LoyaltyAccount extends Model
{
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'loyalty_accounts';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'program_id',
        'tier',
        'points_balance',
        'lifetime_points',
    ];

    protected function casts(): array
    {
        return [
            'points_balance' => 'integer',
            'lifetime_points' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class, 'program_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'account_id');
    }
}
