<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Models;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $ingredient_id
 * @property string $delta
 * @property string $balance_after
 * @property string $reason
 * @property string|null $reference_type
 * @property string|null $reference_id
 * @property int|null $cost_per_unit
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $recorded_at
 * @property string|null $created_by
 */
class StockMovement extends Model
{
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    public $timestamps = false;

    protected $table = 'stock_movements';

    protected $fillable = [
        'tenant_id',
        'ingredient_id',
        'delta',
        'balance_after',
        'reason',
        'reference_type',
        'reference_id',
        'cost_per_unit',
        'notes',
        'recorded_at',
        'created_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'delta' => 'decimal:3',
            'balance_after' => 'decimal:3',
            'cost_per_unit' => 'integer',
            'recorded_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }

    public function reasonEnum(): ?StockMovementReason
    {
        return StockMovementReason::tryFrom($this->reason);
    }
}
