<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Actions\StaffPinLoginAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Staff\StaffLoginRequest;
use App\Http\Resources\V1\Auth\UserResource;
use App\Http\Resources\V1\Staff\EmployeeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class StaffAuthController extends Controller
{
    /**
     * POST /api/v1/auth/staff-login
     *
     * Public, rate-limited endpoint. 5 attempts per phone per 15 minutes —
     * implemented manually because Laravel's `throttle:5,15` keys by IP/route
     * and we need per-phone granularity.
     */
    public function login(StaffLoginRequest $request, StaffPinLoginAction $login): JsonResponse
    {
        $phone = (string) $request->string('phone');
        $key = 'staff-pin:' . $phone;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'pin' => [__("Juda ko'p urinish. {$seconds} soniyadan so'ng qayta urining")],
            ])->status(429);
        }

        try {
            $result = $login(
                phone: $phone,
                pin: (string) $request->string('pin'),
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
                'user' => UserResource::make($result['user']),
                'employee' => EmployeeResource::make($result['employee']->load('user')),
            ],
        ]);
    }
}
