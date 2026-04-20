<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Notification;

use App\Domain\Notification\Models\NotificationLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin NotificationLog */
class NotificationLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'channel' => $this->channel,
            'recipient' => $this->recipient,
            'template' => $this->template,
            'subject' => $this->subject,
            'body' => $this->body,
            'status' => $this->status,
            'provider_message_id' => $this->provider_message_id,
            'error_message' => $this->error_message,
            'metadata' => $this->metadata,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
