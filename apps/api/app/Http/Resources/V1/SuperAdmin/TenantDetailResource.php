<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\SuperAdmin;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Tenant
 */
class TenantDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'legal_name' => $this->legal_name,
            'plan' => $this->subscription_plan ?? $this->plan,
            'status' => $this->subscription_status ?? $this->status,
            'subscription_plan' => $this->subscription_plan,
            'subscription_status' => $this->subscription_status,
            'mrr_minor' => (int) ($this->mrr_minor ?? 0),
            'default_locale' => $this->default_locale,
            'default_currency' => $this->default_currency,
            'timezone' => $this->timezone,
            'phone' => $this->phone,
            'email' => $this->email,
            'logo_url' => $this->logo_url,
            'settings' => $this->settings,
            'feature_flags' => $this->feature_flags,
            'trial_ends_at' => $this->trial_ends_at?->toIso8601String(),
            'subscription_ends_at' => $this->subscription_ends_at?->toIso8601String(),
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'suspension_reason' => $this->suspension_reason,
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'total_orders_count' => (int) ($this->total_orders_count ?? 0),
            'total_revenue_minor' => (int) ($this->total_revenue_minor ?? 0),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
