<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\SuperAdmin;

use App\Domain\SuperAdmin\Models\SuperAdminInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SuperAdminInvitation
 */
class SuperAdminInvitationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'invited_by_user_uuid' => $this->invited_by_user_uuid,
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'metadata' => $this->metadata,
            'is_pending' => $this->isPending(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
