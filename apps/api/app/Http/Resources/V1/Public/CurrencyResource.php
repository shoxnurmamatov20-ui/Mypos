<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use App\Domain\Shared\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase 4 — public currency lookup payload.
 *
 * Used by:
 *   - Marketing site signup wizard (which currency to default to)
 *   - Consumer marketplace currency selector (rare; most users will see
 *     their tenant's home currency)
 *   - Filament + dashboard currency dropdowns
 *
 * Localised name resolved against the request's Accept-Language header
 * (or `app()->getLocale()` fallback). The full `name_translations` map is
 * also returned so clients with their own i18n layer can pick directly.
 *
 * @mixin Currency
 */
class CurrencyResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $locale = $request->getPreferredLanguage(['uz', 'ru', 'en', 'kz', 'ky', 'tg']) ?? app()->getLocale();
        $names = is_array($this->name) ? $this->name : [];

        return [
            'code' => $this->code,
            'name' => $this->nameFor($locale),
            'name_translations' => $names,
            'symbol' => $this->symbol,
            'decimals' => (int) $this->decimals,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
