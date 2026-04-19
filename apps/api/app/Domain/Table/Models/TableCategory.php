<?php

declare(strict_types=1);

namespace App\Domain\Table\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property array<string, string> $name
 * @property string $slug
 * @property int $sort_order
 * @property bool $is_active
 */
class TableCategory extends Model
{
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'table_categories';

    protected $fillable = [
        'tenant_id', 'name', 'slug', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function tables(): HasMany
    {
        return $this->hasMany(Table::class, 'category_id');
    }

    public function name(string $locale = 'uz'): string
    {
        return $this->name[$locale] ?? $this->name['uz'] ?? '';
    }
}
