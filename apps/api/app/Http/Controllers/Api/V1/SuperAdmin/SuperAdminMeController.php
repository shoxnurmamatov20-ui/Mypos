<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SuperAdmin\SuperAdminUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminMeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        return response()->json([
            'data' => SuperAdminUserResource::make($user),
        ]);
    }
}
