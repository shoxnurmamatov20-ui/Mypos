<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Auth;

use App\Http\Resources\V1\Tenant\TenantResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'email' => $this->email,
            'phone' => $this->phone,
            'name' => $this->name,
            'locale' => $this->locale,
            'avatar_url' => $this->avatar_url,
            'is_super_admin' => (bool) $this->is_super_admin,
            'roles' => $this->getRoleNames()->values(),
            'tenant' => $this->when(
                $this->tenant !== null,
                fn () => TenantResource::make($this->tenant),
            ),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
