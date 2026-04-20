<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Models;

use App\Domain\Menu\Models\MenuItem;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $menu_item_id
 * @property string $ingredient_id
 * @property string $quantity
 * @property string $unit
 * @property bool $is_optional
 */
class Recipe extends Model
{
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'recipes';

    protected $fillable = [
        'tenant_id',
        'menu_item_id',
        'ingredient_id',
        'quantity',
        'unit',
        'is_optional',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'is_optional' => 'boolean',
        ];
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
