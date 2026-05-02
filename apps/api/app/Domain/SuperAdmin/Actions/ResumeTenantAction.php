<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;

class ResumeTenantAction
{
    public function __invoke(User $superAdmin, Tenant $tenant): Tenant
    {
        $tenant->forceFill([
            'suspended_at' => null,
            'suspension_reason' => null,
            'subscription_status' => SubscriptionStatus::Active->value,
            'status' => SubscriptionStatus::Active->value,
        ])->save();

        AuditLogger::log('tenant.resumed', [
            'actor_user' => $superAdmin,
            'tenant_id' => $tenant->id,
            'subject_type' => 'tenant',
            'subject_id' => $tenant->id,
            'subject_label' => $tenant->name,
            'severity' => AuditSeverity::Info->value,
        ]);

        return $tenant->fresh();
    }
}
