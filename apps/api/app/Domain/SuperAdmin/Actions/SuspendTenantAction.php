<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;

class SuspendTenantAction
{
    /**
     * @param array{reason?: string|null, notes?: string|null} $input
     */
    public function __invoke(User $superAdmin, Tenant $tenant, array $input = []): Tenant
    {
        $reason = $input['reason'] ?? 'other';

        $tenant->forceFill([
            'suspended_at' => now(),
            'suspension_reason' => $reason,
            'subscription_status' => SubscriptionStatus::Suspended->value,
            'status' => SubscriptionStatus::Suspended->value,
        ])->save();

        AuditLogger::log('tenant.suspended', [
            'actor_user' => $superAdmin,
            'tenant_id' => $tenant->id,
            'subject_type' => 'tenant',
            'subject_id' => $tenant->id,
            'subject_label' => $tenant->name,
            'severity' => AuditSeverity::Warning->value,
            'metadata' => [
                'reason' => $reason,
                'notes' => $input['notes'] ?? null,
            ],
        ]);

        return $tenant->fresh();
    }
}
