<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 4 — ISO 3166-1 alpha-2 country lookup.
 *
 * Stub created by Agent E5 (Filament). The migration owns the schema; this
 * model exists so {@see \App\Filament\Resources\CountryResource} can read /
 * write rows through the standard Eloquent surface. Replace with the canonical
 * model once Agent E1 ships its richer version (capability methods, casts,
 * relationships) — only the table name + column casts are load-bearing.
 *
 * NO RLS / NO tenant scope — global lookup table read by every tenant.
 *
 * @property string $code
 * @property array<string, string> $name
 * @property string $currency_code
 * @property string $default_locale
 * @property string $phone_prefix
 * @property string $timezone
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $launched_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Country extends Model
{
    /**
     * `code` is the natural primary key (ISO 3166-1 alpha-2).
     * Eloquent needs to be told it is non-incrementing + string-typed,
     * otherwise it'll try to insert NULL into an int id column.
     */
    protected $table = 'countries';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'name',
        'currency_code',
        'default_locale',
        'phone_prefix',
        'timezone',
        'is_active',
        'launched_at',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'is_active' => 'boolean',
            'launched_at' => 'date',
        ];
    }

    /**
     * FK to currencies.code — used by the Filament CountryResource form's
     * currency selector via the `relationship()` helper.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    /**
     * Localized display name with fallback chain (locale → en → first).
     */
    public function displayName(?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $name = $this->name;
        if (! is_array($name) || $name === []) {
            return $this->code;
        }
        return (string) (
            $name[$locale]
            ?? $name['en']
            ?? $name['uz']
            ?? reset($name)
        );
    }
}
