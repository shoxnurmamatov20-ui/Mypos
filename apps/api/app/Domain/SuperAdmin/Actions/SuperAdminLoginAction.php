<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditActorType;
use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SuperAdminLoginAction
{
    /**
     * @return array{user: User, token: string, role: string|null}
     */
    public function __invoke(string $email, string $password, ?string $ip = null): array
    {
        $user = User::query()
            ->where('email', $email)
            ->where('is_super_admin', true)
            ->whereNull('deleted_at')
            ->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            AuditLogger::log('super_admin.login_failed', [
                'actor_type' => AuditActorType::System->value,
                'actor_label' => $email,
                'severity' => AuditSeverity::Warning->value,
                'ip_address' => $ip,
                'metadata' => ['email' => $email],
            ]);

            throw ValidationException::withMessages([
                'email' => [__("Login ma'lumotlari noto'g'ri")],
            ]);
        }

        $user->forceFill([
            'last_super_admin_login_at' => now(),
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ])->save();

        // Revoke previous super-admin web tokens for this user (single-session).
        $user->tokens()->where('name', 'super-admin-web')->delete();

        // SECURITY: Super-admin tokens are extremely high-privilege (they bypass
        // tenant scoping, can suspend tenants, impersonate owners, etc.). We
        // deliberately keep the TTL at 1 hour so a leaked token rapidly becomes
        // useless. Operators must re-authenticate frequently. Ability is locked
        // to ['super-admin'] only — no wildcard.
        $token = $user->createToken(
            name: 'super-admin-web',
            abilities: ['super-admin'],
            expiresAt: now()->addHour(),
        )->plainTextToken;

        AuditLogger::log('super_admin.login', [
            'actor_user' => $user,
            'actor_type' => AuditActorType::SuperAdmin->value,
            'severity' => AuditSeverity::Info->value,
            'ip_address' => $ip,
            'metadata' => ['email' => $user->email, 'role' => $user->super_admin_role],
        ]);

        return [
            'user' => $user->fresh(),
            'token' => $token,
            'role' => $user->super_admin_role,
        ];
    }
}
