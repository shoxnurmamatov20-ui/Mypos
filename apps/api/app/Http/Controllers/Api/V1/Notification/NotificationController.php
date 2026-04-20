<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Notification;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Notification\Models\NotificationLog;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Notification\NotificationLogResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'channel' => ['nullable', Rule::in(NotificationChannel::values())],
            'status' => ['nullable', Rule::in(NotificationStatus::values())],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = NotificationLog::query()->orderBy('created_at', 'desc');

        if (isset($validated['channel'])) {
            $query->where('channel', $validated['channel']);
        }
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $perPage = (int) ($validated['per_page'] ?? 30);

        return NotificationLogResource::collection($query->paginate($perPage));
    }

    public function markAsRead(NotificationLog $notification): NotificationLogResource
    {
        $notification->markRead();

        return NotificationLogResource::make($notification->refresh());
    }
}
