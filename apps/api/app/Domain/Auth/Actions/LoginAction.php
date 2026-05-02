<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    /**
     * @param string $identifier email, phone, or username
     * @return array{user: User, token: string}
     */
    public function __invoke(string $identifier, string $password, ?string $ip = null): array
    {
        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => [__("Login ma'lumotlari noto'g'ri")],
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        // Revoke previous tokens with the same name to keep the list clean.
        $user->tokens()->where('name', 'web-session')->delete();

        $tokenName = 'web-session';

        // SECURITY: Tenant tokens MUST NOT carry the wildcard '*' ability — that
        // historically allowed a tenant token to bypass the EnsureSuperAdmin guard
        // (which previously accepted '*' as equivalent to 'super-admin').
        //
        // We issue 'tenant:full' instead. This identifies the token as a legitimate
        // tenant session; per-resource authorization is still enforced by Spatie
        // policies and FormRequest authorize() checks downstream.
        //
        // TTL reduced from 30 days to 7 days to shrink the blast radius of stolen
        // tokens (e.g., XSS-leaked localStorage, exposed mobile keychain).
        $token = $user->createToken(
            $tokenName,
            $this->resolveAbilities($user),
            now()->addDays(7),
        )->plainTextToken;

        return [
            'user' => $user->fresh(['tenant', 'roles']),
            'token' => $token,
        ];
    }

    /**
     * Map a tenant user's Spatie roles to a coarse-grained Sanctum ability set.
     *
     * For now we issue the umbrella 'tenant:full' ability for all tenant users —
     * fine-grained scoping (e.g., per-role ability lists like 'orders:*',
     * 'payments:*') will land in a follow-up task once policies are wired to
     * tokenCan() checks alongside the existing role-based gates.
     *
     * @return array<int, string>
     */
    private function resolveAbilities(User $user): array
    {
        // Defense-in-depth: if for any reason `is_super_admin` is true on a user
        // logging in via the tenant flow, do NOT mint a 'super-admin' ability —
        // that path is reserved for SuperAdminLoginAction.
        return ['tenant:full'];
    }
}
