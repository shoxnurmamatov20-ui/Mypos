<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Uzbekistan tuman/city lookup, FK to regions.
 *
 * Global reference table — NOT tenant-scoped.
 *
 * @property int $id
 * @property int $region_id
 * @property string $code
 * @property string $name_uz
 * @property string|null $name_ru
 * @property string|null $name_en
 * @property string $type   one of 'city', 'district', 'tuman'
 * @property bool $is_active
 */
class District extends Model
{
    protected $fillable = ['region_id', 'code', 'name_uz', 'name_ru', 'name_en', 'type', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function localizedName(?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        return match ($locale) {
            'ru' => $this->name_ru ?: $this->name_uz,
            'en' => $this->name_en ?: $this->name_uz,
            default => $this->name_uz,
        };
    }
}
