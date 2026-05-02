<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class RevokeSuperAdminAction
{
    public function __invoke(User $superAdmin, User $target): User
    {
        if ($superAdmin->id === $target->id) {
            throw ValidationException::withMessages([
                'user' => [__('O\'zingizning super admin huquqlaringizni bekor qila olmaysiz')],
            ]);
        }

        if (! $target->is_super_admin) {
            throw ValidationException::withMessages([
                'user' => [__('Bu foydalanuvchi super admin emas')],
            ]);
        }

        $previousRole = $target->super_admin_role;

        $target->forceFill([
            'is_super_admin' => false,
            'super_admin_role' => null,
        ])->save();

        if ($target->hasRole('super_admin')) {
            $target->removeRole('super_admin');
        }

        // Revoke ALL active super-admin tokens
        $target->tokens()->where('name', 'super-admin-web')->delete();

        AuditLogger::log('super_admin.revoked', [
            'actor_user' => $superAdmin,
            'subject_type' => 'user',
            'subject_id' => $target->uuid,
            'subject_label' => $target->email,
            'severity' => AuditSeverity::Warning->value,
            'metadata' => [
                'target_user_id' => $target->uuid,
                'target_email' => $target->email,
                'previous_role' => $previousRole,
            ],
        ]);

        return $target->fresh();
    }
}
