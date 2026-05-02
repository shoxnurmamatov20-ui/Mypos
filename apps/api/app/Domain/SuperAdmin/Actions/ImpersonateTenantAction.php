<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Issues a short-lived (15 min) Sanctum token impersonating a tenant owner.
 * HIGH RISK — every use is logged at Warning severity.
 *
 * SECURITY: Tokens default to read-only ability ('impersonated:read'). Write
 * operations on behalf of a tenant during impersonation MUST be guarded by an
 * explicit elevation step (re-auth + reason capture). The write-elevation flow
 * is tracked as a follow-up task and is intentionally NOT enabled here.
 */
class ImpersonateTenantAction
{
    /**
     * @return array{token: string, user: User, tenant: Tenant, expires_at: \Illuminate\Support\Carbon}
     */
    public function __invoke(User $superAdmin, Tenant $tenant): array
    {
        // Find the tenant's owner — first user with role='owner', else any user.
        $owner = User::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->where('is_super_admin', false)
            ->get()
            ->first(fn (User $u): bool => $u->hasRole('owner'));

        if ($owner === null) {
            $owner = User::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('is_super_admin', false)
                ->whereNull('deleted_at')
                ->orderBy('created_at')
                ->first();
        }

        if ($owner === null) {
            throw ValidationException::withMessages([
                'tenant_id' => [__('Bu ijarachida foydalanuvchi yo\'q')],
            ]);
        }

        // SECURITY: Reduced from 1h to 15min. Impersonation is the highest-risk
        // privileged operation in the system — a leaked impersonation token grants
        // an attacker tenant-owner equivalence. Keep the window tight.
        $expiresAt = now()->addMinutes(15);
        $tokenName = 'impersonation:' . $superAdmin->id;

        // Revoke any prior impersonation tokens issued by this super admin for the
        // same target user — keeps the personal_access_tokens table tidy.
        $owner->tokens()->where('name', $tokenName)->delete();

        // SECURITY: Read-only ability by default. Previous version granted full
        // 'tenant-admin' on impersonation, which meant a support engineer could
        // silently mutate tenant data with no second factor. Writes during
        // impersonation must be gated behind an explicit elevation step — that
        // flow is a separate task and is NOT yet implemented.
        $token = $owner->createToken(
            name: $tokenName,
            abilities: ['impersonated:read'],
            expiresAt: $expiresAt,
        )->plainTextToken;

        AuditLogger::log('tenant.impersonated', [
            'actor_user' => $superAdmin,
            'tenant_id' => $tenant->id,
            'subject_type' => 'tenant',
            'subject_id' => $tenant->id,
            'subject_label' => $tenant->name,
            'severity' => AuditSeverity::Warning->value,
            'metadata' => [
                'super_admin_id' => $superAdmin->uuid,
                'super_admin_email' => $superAdmin->email,
                'target_user_id' => $owner->uuid,
                'target_user_email' => $owner->email,
                'target_tenant_id' => $tenant->id,
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);

        return [
            'token' => $token,
            'user' => $owner->fresh(),
            'tenant' => $tenant->fresh(),
            'expires_at' => $expiresAt,
        ];
    }
}
