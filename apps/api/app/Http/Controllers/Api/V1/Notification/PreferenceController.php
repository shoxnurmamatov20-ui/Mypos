<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Notification;

use App\Domain\Notification\Models\NotificationPreference;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Notification\StoreNotificationPreferenceRequest;
use App\Http\Resources\V1\Notification\NotificationPreferenceResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class PreferenceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        abort_if($user === null, Response::HTTP_UNAUTHORIZED);

        $prefs = NotificationPreference::query()
            ->where('user_uuid', $user->uuid)
            ->orderBy('channel')
            ->get();

        return NotificationPreferenceResource::collection($prefs);
    }

    public function update(
        StoreNotificationPreferenceRequest $request,
        NotificationPreference $preference,
    ): NotificationPreferenceResource {
        $user = $request->user();
        abort_if($user === null, Response::HTTP_UNAUTHORIZED);
        abort_if($preference->user_uuid !== $user->uuid, Response::HTTP_FORBIDDEN);

        $preference->update($request->validated());

        return NotificationPreferenceResource::make($preference->refresh());
    }

    public function upsert(StoreNotificationPreferenceRequest $request): NotificationPreferenceResource
    {
        $user = $request->user();
        abort_if($user === null, Response::HTTP_UNAUTHORIZED);

        $data = $request->validated();

        /** @var NotificationPreference $pref */
        $pref = NotificationPreference::query()->updateOrCreate(
            [
                'user_uuid' => $user->uuid,
                'channel' => $data['channel'],
                'template' => $data['template'] ?? null,
            ],
            ['enabled' => (bool) $data['enabled']],
        );

        return NotificationPreferenceResource::make($pref);
    }
}
