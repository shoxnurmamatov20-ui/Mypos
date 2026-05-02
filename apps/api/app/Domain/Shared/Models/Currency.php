<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Phase 4 — ISO 4217 currency lookup row.
 *
 * Backed by the static `currencies` table seeded in the
 * `2026_07_01_000002_create_currencies_table` migration. NOT tenant-scoped:
 * every tenant sees the same list (and the public `/api/v1/public/currencies`
 * endpoint returns it without auth, so signup forms can pre-populate).
 *
 * The `code` column is the primary key — that's why we override $primaryKey
 * and disable auto-increment / set keyType=string. Same approach as the
 * companion {@see Country} model.
 *
 * @property string $code
 * @property array<string, string> $name
 * @property string $symbol
 * @property int $decimals
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Currency extends Model
{
    protected $table = 'currencies';
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'decimals',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'decimals' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Resolve the localised display name for a given locale, falling back
     * to English. Mirrors the same pattern used by Country.
     */
    public function nameFor(string $locale): string
    {
        $names = is_array($this->name) ? $this->name : [];

        return (string) (
            $names[$locale]
            ?? $names['en']
            ?? $this->code
        );
    }
}
