<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Auth\Actions\LoginAction;
use App\Domain\Auth\Services\PostLoginRedirector;
use App\Domain\SuperAdmin\Actions\SuperAdminLoginAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Auth\LoginRequest;
use App\Http\Resources\V1\Auth\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/forgot-password
     *
     * Always returns 200 to prevent email enumeration. If the email exists,
     * Laravel's password broker sends a reset link via the configured mailer
     * (MAIL_MAILER=log in dev — check storage/logs/laravel.log for the URL).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        // Send reset link (no-op if email not found — anti-enumeration).
        Password::sendResetLink([
            'email' => $request->string('email')->toString(),
        ]);

        return response()->json([
            'data' => [
                'message' => __('Agar email ro\'yxatdan o\'tgan bo\'lsa, reset havolasi yuborildi'),
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/reset-password
     *
     * Accepts the token sent via email along with the new password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->password = $password;
                $user->save();
            },
        );

        if ($status !== Password::PasswordReset) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'data' => ['message' => __('Parolingiz yangilandi')],
        ]);
    }


    public function login(
        LoginRequest $request,
        LoginAction $login,
        SuperAdminLoginAction $superAdminLogin,
        PostLoginRedirector $redirector,
    ): JsonResponse {
        $identifier = $request->string('identifier')->toString();
        $password = $request->string('password')->toString();

        // CROSS-2 (2026-05-10): if the credential belongs to a super admin,
        // mint a 'super-admin'-ability token via SuperAdminLoginAction so the
        // web-superadmin app's middleware (EnsureSuperAdmin) accepts it. The
        // generic LoginAction issues 'tenant:full' which is rejected for
        // super-admin endpoints (see EnsureSuperAdmin §security).
        $candidate = User::query()
            ->where(function ($q) use ($identifier): void {
                $q->where('email', $identifier)->orWhere('phone', $identifier);
            })
            ->whereNull('deleted_at')
            ->first(['email', 'is_super_admin']);

        if ($candidate !== null && (bool) $candidate->is_super_admin === true) {
            $result = $superAdminLogin(
                email: (string) $candidate->email,
                password: $password,
                ip: $request->ip(),
            );
        } else {
            $result = $login(
                identifier: $identifier,
                password: $password,
                ip: $request->ip(),
            );
        }

        $user = $result['user'];

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user' => UserResource::make($user),
                // PORT-1 (2026-05-10): role-based post-login redirect.
                // Used by web-portal `/dispatch` page to send the user to
                // the correct app immediately after authentication.
                'role' => $redirector->resolveRoleFor($user),
                'redirect_url' => $redirector->resolveFor($user),
            ],
        ]);
    }

    public function me(Request $request, PostLoginRedirector $redirector): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $user->load(['tenant', 'roles']);

        return response()->json([
            'data' => UserResource::make($user),
            'meta' => [
                'role' => $redirector->resolveRoleFor($user),
                'redirect_url' => $redirector->resolveFor($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()?->currentAccessToken();
        $token?->delete();

        return response()->json([
            'data' => ['message' => 'Muvaffaqiyatli chiqdingiz'],
        ]);
    }
}
