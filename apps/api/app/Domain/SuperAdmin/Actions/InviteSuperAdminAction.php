<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Enums\SuperAdminRole;
use App\Domain\SuperAdmin\Models\SuperAdminInvitation;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InviteSuperAdminAction
{
    /**
     * @param array{email: string, role?: string|null, name?: string|null} $input
     *
     * @return array{invitation: SuperAdminInvitation, plain_token: string}
     */
    public function __invoke(User $superAdmin, array $input): array
    {
        $email = mb_strtolower(trim($input['email']));
        $role = $input['role'] ?? SuperAdminRole::Support->value;

        if (! in_array($role, SuperAdminRole::values(), true)) {
            throw ValidationException::withMessages([
                'role' => [__('Roli noto\'g\'ri')],
            ]);
        }

        // Block if already a super admin
        $existing = User::query()
            ->where('email', $email)
            ->where('is_super_admin', true)
            ->whereNull('deleted_at')
            ->first();
        if ($existing !== null) {
            throw ValidationException::withMessages([
                'email' => [__('Bu email allaqachon super admin')],
            ]);
        }

        // Revoke any open invitations for this email
        SuperAdminInvitation::query()
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        $plainToken = Str::random(48);
        $invitation = SuperAdminInvitation::create([
            'email' => $email,
            'token_hash' => SuperAdminInvitation::hashToken($plainToken),
            'invited_by_user_uuid' => $superAdmin->uuid,
            'expires_at' => now()->addDays(7),
            'metadata' => [
                'role' => $role,
                'name' => $input['name'] ?? null,
            ],
        ]);

        AuditLogger::log('super_admin.invited', [
            'actor_user' => $superAdmin,
            'subject_type' => 'super_admin_invitation',
            'subject_id' => $invitation->id,
            'subject_label' => $email,
            'severity' => AuditSeverity::Info->value,
            'metadata' => [
                'invited_email' => $email,
                'role' => $role,
            ],
        ]);

        return [
            'invitation' => $invitation->fresh(),
            'plain_token' => $plainToken,
        ];
    }
}
