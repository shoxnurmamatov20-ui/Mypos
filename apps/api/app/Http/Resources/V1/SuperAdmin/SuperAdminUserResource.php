<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\SuperAdmin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class SuperAdminUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'is_super_admin' => (bool) $this->is_super_admin,
            'super_admin_role' => $this->super_admin_role,
            'mfa_enabled' => (bool) $this->mfa_enabled,
            'last_super_admin_login_at' => $this->last_super_admin_login_at?->toIso8601String(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
