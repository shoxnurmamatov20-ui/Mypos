<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Actions\SuperAdminLoginAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SuperAdmin\SuperAdminLoginRequest;
use App\Http\Resources\V1\SuperAdmin\SuperAdminUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class SuperAdminAuthController extends Controller
{
    /**
     * POST /api/v1/super-admin/login
     *
     * Public, IP+email throttle: 5 attempts / 15 minutes per (email, ip).
     */
    public function login(SuperAdminLoginRequest $request, SuperAdminLoginAction $login): JsonResponse
    {
        $email = (string) $request->string('email');
        $key = 'super-admin-login:' . sha1(mb_strtolower($email) . '|' . ($request->ip() ?? 'unknown'));

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => [__("Juda ko'p urinish. {$seconds} soniyadan so'ng qayta urining")],
            ])->status(429);
        }

        try {
            $result = $login(
                email: $email,
                password: (string) $request->string('password'),
                ip: $request->ip(),
            );
        } catch (ValidationException $e) {
            RateLimiter::hit($key, 60 * 15);
            throw $e;
        }

        RateLimiter::clear($key);

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user' => SuperAdminUserResource::make($result['user']),
                'role' => $result['role'],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()?->currentAccessToken();
        $token?->delete();

        return response()->json([
            'data' => ['message' => __('Muvaffaqiyatli chiqdingiz')],
        ]);
    }
}
