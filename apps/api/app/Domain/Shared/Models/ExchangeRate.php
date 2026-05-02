<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 4 — Daily FX rate snapshot.
 *
 * Append-only history table — see migration
 * `2026_07_01_000003_create_exchange_rates_table.php` for the rationale and
 * column-by-column docs. One row per (from_currency, to_currency, rate_date)
 * triple, enforced by a unique index so the daily sync job is retry-safe.
 *
 * Convention: `rate` means "1 unit of from_currency equals N units of
 * to_currency". So a row {from: 'USD', to: 'UZS', rate: 12805.50} means
 * $1 ≈ 12,805.50 so'm.
 *
 * The `id` is a bigint auto-increment — this is one of the few non-tenant,
 * append-only tables where UUIDs are unnecessary and would just bloat the
 * index. NOT tenant-scoped (no `tenant_id`), so {@see BelongsToTenant} is
 * deliberately not used.
 *
 * Reads almost always go through {@see \App\Domain\Shared\Services\FxRateService}
 * which adds the cache layer. Direct queries are fine for admin tooling.
 *
 * @property int $id
 * @property string $from_currency
 * @property string $to_currency
 * @property string $rate                 — Decimal stored as string in PHP
 * @property string $source
 * @property \Illuminate\Support\Carbon $rate_date
 * @property \Illuminate\Support\Carbon $fetched_at
 * @property \Illuminate\Support\Carbon $created_at
 */
class ExchangeRate extends Model
{
    protected $table = 'exchange_rates';

    /**
     * The migration intentionally omits `updated_at` — rows are append-only.
     * Disable Laravel's automatic timestamp management so we don't try to
     * write a non-existent column.
     */
    public $timestamps = false;

    protected $fillable = [
        'from_currency',
        'to_currency',
        'rate',
        'source',
        'rate_date',
        'fetched_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'rate_date' => 'date',
            'fetched_at' => 'datetime',
            'created_at' => 'datetime',
            // `rate` stays a string so callers don't lose precision via float;
            // FxRateService casts to float once, at the boundary.
        ];
    }

    /**
     * FK to currencies.code — used by the Filament ExchangeRateResource form
     * + filter relationship() helpers.
     */
    public function fromCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'from_currency', 'code');
    }

    public function toCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'to_currency', 'code');
    }
}
