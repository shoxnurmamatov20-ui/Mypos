<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Enums\SuperAdminRole;
use App\Domain\SuperAdmin\Models\SuperAdminInvitation;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AcceptSuperAdminInvitationAction
{
    /**
     * @param array{token: string, name: string, password: string} $input
     *
     * @return array{user: User, token: string, role: string|null}
     */
    public function __invoke(array $input, ?string $ip = null): array
    {
        $invitation = SuperAdminInvitation::query()
            ->where('token_hash', SuperAdminInvitation::hashToken($input['token']))
            ->first();

        if ($invitation === null
            || $invitation->accepted_at !== null
            || $invitation->revoked_at !== null
            || $invitation->expires_at->isPast()
        ) {
            throw ValidationException::withMessages([
                'token' => [__('Taklifnoma yaroqsiz yoki muddati o\'tgan')],
            ]);
        }

        $role = (string) ($invitation->metadata['role'] ?? SuperAdminRole::Support->value);

        return DB::transaction(function () use ($invitation, $input, $role, $ip): array {
            $user = User::query()->where('email', $invitation->email)->first();

            if ($user !== null) {
                $user->forceFill([
                    'is_super_admin' => true,
                    'super_admin_role' => $role,
                    'name' => $user->name === '' ? $input['name'] : $user->name,
                    'password' => Hash::make($input['password']),
                ])->save();
            } else {
                $user = User::create([
                    'uuid' => (string) Str::uuid(),
                    'tenant_id' => null,
                    'name' => $input['name'],
                    'email' => $invitation->email,
                    'locale' => 'uz',
                    'password' => Hash::make($input['password']),
                    'is_super_admin' => true,
                    'super_admin_role' => $role,
                ]);
            }

            Role::findOrCreate('super_admin', 'web');
            if (! $user->hasRole('super_admin')) {
                $user->assignRole('super_admin');
            }

            $invitation->forceFill([
                'accepted_at' => now(),
                'accepted_by_user_uuid' => $user->uuid,
            ])->save();

            $user->forceFill([
                'last_super_admin_login_at' => now(),
                'last_login_at' => now(),
                'last_login_ip' => $ip,
            ])->save();

            // SECURITY: Match SuperAdminLoginAction TTL (1 hour). High-privilege
            // tokens must be short-lived. Ability locked to 'super-admin' — no '*'.
            $token = $user->createToken(
                name: 'super-admin-web',
                abilities: ['super-admin'],
                expiresAt: now()->addHour(),
            )->plainTextToken;

            AuditLogger::log('super_admin.invitation_accepted', [
                'actor_user' => $user,
                'subject_type' => 'super_admin_invitation',
                'subject_id' => $invitation->id,
                'subject_label' => $user->email,
                'severity' => AuditSeverity::Info->value,
                'ip_address' => $ip,
                'metadata' => ['role' => $role],
            ]);

            return [
                'user' => $user->fresh(),
                'token' => $token,
                'role' => $role,
            ];
        });
    }
}
