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
        $token = $user->createToken($tokenName, ['*'], now()->addDays(30))->plainTextToken;

        return [
            'user' => $user->fresh(['tenant', 'roles']),
            'token' => $token,
        ];
    }
}
