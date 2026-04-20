<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Notification;

use App\Domain\Notification\Models\NotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin NotificationPreference */
class NotificationPreferenceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_uuid' => $this->user_uuid,
            'channel' => $this->channel,
            'template' => $this->template,
            'enabled' => $this->enabled,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
