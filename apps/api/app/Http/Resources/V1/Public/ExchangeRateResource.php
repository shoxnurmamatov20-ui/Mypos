<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use App\Domain\Shared\Models\ExchangeRate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 4 — public FX rate snapshot payload.
 *
 * Returned by `GET /api/v1/public/exchange-rates`. Surfaces:
 *   - the canonical "1 from = N to" rate
 *   - the source provider (cbu / nbp / nbkr / fixer / manual) so anyone
 *     consuming the API can audit where the number came from
 *   - the rate_date — different from fetched_at because central banks
 *     post tomorrow's rates today, and our cron runs at 02:00.
 *
 * @mixin ExchangeRate
 */
class ExchangeRateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'from' => $this->from_currency,
            'to' => $this->to_currency,
            // Cast string→float here, NOT inside the model — the model
            // intentionally keeps decimal precision. Floats are good
            // enough for wire transmission.
            'rate' => (float) $this->rate,
            'source' => $this->source,
            'rate_date' => $this->rate_date?->toDateString(),
            'fetched_at' => $this->fetched_at?->toIso8601String(),
        ];
    }
}
