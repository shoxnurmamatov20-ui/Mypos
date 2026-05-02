<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Kiosk;

use App\Domain\Kiosk\Models\KioskDevice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing kiosk device payload — never exposes the token hash.
 *
 * @mixin KioskDevice
 */
class KioskDeviceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'location_label' => $this->location_label,
            'status' => $this->status,
            'language' => $this->language,
            'theme' => $this->theme,
            'idle_timeout_seconds' => (int) $this->idle_timeout_seconds,
            'device_token_last4' => $this->device_token_last4,
            'device_info' => $this->device_info,
            'paired_at' => $this->paired_at?->toIso8601String(),
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
