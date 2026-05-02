<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TenantDomain
 */
class DomainResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $token = $this->verification_token;

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'domain' => $this->domain,
            'is_primary' => (bool) $this->is_primary,
            'is_verified' => (bool) $this->is_verified,
            'verification_method' => $this->verification_method,
            'verification_token' => $token,

            // Concrete copy-pasteable instructions for the dashboard so the
            // owner doesn't need to know the platform's DNS conventions.
            'instructions' => [
                'txt' => sprintf(
                    'Add a TXT record at _mypos.%s with value: %s',
                    $this->domain,
                    (string) $token,
                ),
                'cname' => sprintf(
                    'Or add a CNAME record www.%s pointing to proxy.mypos.uz',
                    $this->domain,
                ),
            ],

            'verified_at' => $this->verified_at?->toIso8601String(),
            'ssl_status' => $this->ssl_status,
            'ssl_issued_at' => $this->ssl_issued_at?->toIso8601String(),
            'ssl_error' => $this->ssl_error,
            'last_checked_at' => $this->last_checked_at?->toIso8601String(),
            'redirects_to' => $this->redirects_to,

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
