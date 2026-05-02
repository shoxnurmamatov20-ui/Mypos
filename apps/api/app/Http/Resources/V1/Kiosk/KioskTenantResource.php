<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Kiosk;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Minimal tenant payload exposed to a paired kiosk device — used so the
 * kiosk PWA can configure brand, language and currency right after pairing.
 *
 * @mixin Tenant
 */
class KioskTenantResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'logo_url' => $this->logo_url,
            'default_locale' => $this->default_locale,
            'default_currency' => $this->default_currency,
            'timezone' => $this->timezone,
        ];
    }
}
