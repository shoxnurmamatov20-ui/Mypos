<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $tenant_id
 * @property array<string, string> $name
 * @property int $sort_order
 */
class IngredientCategory extends Model
{
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'ingredient_categories';

    protected $fillable = [
        'tenant_id',
        'name',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class, 'category_id');
    }

    public function name(string $locale = 'uz'): string
    {
        return $this->name[$locale] ?? $this->name['uz'] ?? '';
    }
}
