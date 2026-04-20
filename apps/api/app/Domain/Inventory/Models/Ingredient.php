<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\IngredientFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $category_id
 * @property array<string, string> $name
 * @property string|null $sku
 * @property string $unit
 * @property int $cost_per_unit
 * @property string $current_stock
 * @property string|null $min_stock
 * @property string|null $reorder_point
 * @property bool $is_active
 * @property array<string, mixed>|null $metadata
 */
class Ingredient extends Model
{
    /** @use HasFactory<IngredientFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'ingredients';

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'sku',
        'unit',
        'cost_per_unit',
        'current_stock',
        'min_stock',
        'reorder_point',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'metadata' => 'array',
            'is_active' => 'boolean',
            'cost_per_unit' => 'integer',
            'current_stock' => 'decimal:3',
            'min_stock' => 'decimal:3',
            'reorder_point' => 'decimal:3',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(IngredientCategory::class, 'category_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'ingredient_id');
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class, 'ingredient_id');
    }

    public function name(string $locale = 'uz'): string
    {
        return $this->name[$locale] ?? $this->name['uz'] ?? '';
    }

    /** Ingredients whose current_stock <= min_stock (only rows with min_stock set). */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereNotNull('min_stock')
            ->whereColumn('current_stock', '<=', 'min_stock');
    }

    public function isLowStock(): bool
    {
        if ($this->min_stock === null) {
            return false;
        }
        return (float) $this->current_stock <= (float) $this->min_stock;
    }

    protected static function newFactory(): IngredientFactory
    {
        return IngredientFactory::new();
    }
}
