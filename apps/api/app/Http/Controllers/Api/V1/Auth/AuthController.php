<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Auth\Actions\LoginAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Auth\LoginRequest;
use App\Http\Resources\V1\Auth\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(LoginRequest $request, LoginAction $login): JsonResponse
    {
        $result = $login(
            identifier: $request->string('identifier')->toString(),
            password: $request->string('password')->toString(),
            ip: $request->ip(),
        );

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user' => UserResource::make($result['user']),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $user->load(['tenant', 'roles']);

        return response()->json([
            'data' => UserResource::make($user),
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
