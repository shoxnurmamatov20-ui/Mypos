<?php

declare(strict_types=1);

namespace App\Domain\Menu\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\MenuItemFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $category_id
 * @property array<string, string> $name
 * @property array<string, string>|null $description
 * @property string $slug
 * @property string|null $sku
 * @property int $price_amount
 * @property string $price_currency
 * @property int|null $cost_amount
 * @property string|null $image_url
 * @property string|null $thumbnail_url
 * @property array<int, string>|null $allergens
 * @property array<int, string>|null $tags
 * @property int|null $calories
 * @property int|null $preparation_minutes
 * @property bool $is_active
 * @property bool $is_featured
 * @property bool $is_new
 * @property bool $has_discount
 * @property int|null $discount_percent
 * @property bool $stock_tracked
 * @property int|null $current_stock
 * @property int|null $low_stock_threshold
 * @property int $sort_order
 */
class MenuItem extends Model
{
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'menu_items';

    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'description', 'slug', 'sku',
        'price_amount', 'price_currency', 'cost_amount',
        'image_url', 'thumbnail_url',
        'allergens', 'tags', 'calories', 'preparation_minutes',
        'is_active', 'is_featured', 'is_new', 'has_discount', 'discount_percent',
        'stock_tracked', 'current_stock', 'low_stock_threshold',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'allergens' => 'array',
            'tags' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_new' => 'boolean',
            'has_discount' => 'boolean',
            'stock_tracked' => 'boolean',
            'price_amount' => 'integer',
            'cost_amount' => 'integer',
            'calories' => 'integer',
            'preparation_minutes' => 'integer',
            'discount_percent' => 'integer',
            'current_stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function name(string $locale = 'uz'): string
    {
        return $this->name[$locale] ?? $this->name['uz'] ?? '';
    }

    public function description(string $locale = 'uz'): ?string
    {
        if ($this->description === null) {
            return null;
        }
        return $this->description[$locale] ?? $this->description['uz'] ?? null;
    }

    /** Effective price after discount. */
    public function effectivePrice(): int
    {
        if (! $this->has_discount || $this->discount_percent === null) {
            return $this->price_amount;
        }
        return (int) round($this->price_amount * (100 - $this->discount_percent) / 100);
    }
}
