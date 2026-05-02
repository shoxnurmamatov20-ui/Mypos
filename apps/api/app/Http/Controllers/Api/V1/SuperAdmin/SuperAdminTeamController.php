<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Actions\AcceptSuperAdminInvitationAction;
use App\Domain\SuperAdmin\Actions\InviteSuperAdminAction;
use App\Domain\SuperAdmin\Actions\RevokeSuperAdminAction;
use App\Domain\SuperAdmin\Models\SuperAdminInvitation;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SuperAdmin\AcceptInvitationRequest;
use App\Http\Requests\V1\SuperAdmin\InviteSuperAdminRequest;
use App\Http\Resources\V1\SuperAdmin\SuperAdminInvitationResource;
use App\Http\Resources\V1\SuperAdmin\SuperAdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminTeamController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $admins = User::query()
            ->where('is_super_admin', true)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->paginate(50);

        return SuperAdminUserResource::collection($admins);
    }

    public function invite(InviteSuperAdminRequest $request, InviteSuperAdminAction $action): JsonResponse
    {
        $result = $action($request->user(), $request->validated());

        return response()->json([
            'data' => [
                'invitation' => SuperAdminInvitationResource::make($result['invitation']),
                'token' => $result['plain_token'], // shown ONCE — caller emails it
            ],
        ], Response::HTTP_CREATED);
    }

    public function pendingInvitations(): JsonResponse
    {
        $invitations = SuperAdminInvitation::query()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => SuperAdminInvitationResource::collection($invitations),
        ]);
    }

    public function acceptInvitation(
        AcceptInvitationRequest $request,
        AcceptSuperAdminInvitationAction $action,
    ): JsonResponse {
        $result = $action($request->validated(), $request->ip());

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user' => SuperAdminUserResource::make($result['user']),
                'role' => $result['role'],
            ],
        ]);
    }

    public function destroy(Request $request, string $userUuid, RevokeSuperAdminAction $action): JsonResponse
    {
        $target = User::query()->where('uuid', $userUuid)->firstOrFail();
        $action($request->user(), $target);

        return response()->json([
            'data' => ['message' => __('Super admin huquqlari bekor qilindi')],
        ]);
    }
}
