<?php

declare(strict_types=1);

namespace App\Domain\Shared\Concerns;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Attach to any tenant-scoped Eloquent model.
 *
 * Requirements for the model:
 *   - has a `tenant_id` column
 *   - optional: set $tenantScopeEnabled = false to opt out
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            $tenantId = self::resolveCurrentTenantId();
            if ($tenantId !== null) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenantId);
            }
        });

        static::creating(function ($model): void {
            if (empty($model->tenant_id)) {
                $tenantId = self::resolveCurrentTenantId();
                if ($tenantId !== null) {
                    $model->tenant_id = $tenantId;
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** Resolve tenant id from the authenticated user (or null for super admins). */
    protected static function resolveCurrentTenantId(): ?string
    {
        $user = Auth::user();
        if ($user === null) {
            return null;
        }
        /** @var \App\Models\User $user */
        if ($user->is_super_admin === true) {
            // Super admin sees all tenants; rely on explicit filters instead.
            return null;
        }
        return $user->tenant_id;
    }
}
