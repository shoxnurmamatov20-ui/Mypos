<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Uzbekistan viloyat (region) lookup.
 *
 * Global reference table — NOT tenant-scoped. Read at signup so the operator
 * can pick which viloyat their restaurant is in.
 *
 * @property int $id
 * @property string $code
 * @property string $name_uz
 * @property string|null $name_ru
 * @property string|null $name_en
 * @property bool $is_active
 */
class Region extends Model
{
    protected $fillable = ['code', 'name_uz', 'name_ru', 'name_en', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
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
