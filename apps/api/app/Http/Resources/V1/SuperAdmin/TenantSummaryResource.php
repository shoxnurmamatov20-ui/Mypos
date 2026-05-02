<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\SuperAdmin;

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Tenant
 */
class TenantSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var User|null $owner */
        $owner = $this->resource->owner ?? null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'plan' => $this->subscription_plan ?? $this->plan,
            'status' => $this->subscription_status ?? $this->status,
            'mrr_minor' => (int) ($this->mrr_minor ?? 0),
            'owner_name' => $owner?->name,
            'owner_email' => $owner?->email,
            'total_orders_count' => (int) ($this->total_orders_count ?? 0),
            'total_revenue_minor' => (int) ($this->total_revenue_minor ?? 0),
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'trial_ends_at' => $this->trial_ends_at?->toIso8601String(),
            'subscription_ends_at' => $this->subscription_ends_at?->toIso8601String(),
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'suspension_reason' => $this->suspension_reason,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
