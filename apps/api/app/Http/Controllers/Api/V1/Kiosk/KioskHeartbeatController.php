<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Actions\HeartbeatKioskAction;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Kiosk\HeartbeatRequest;
use Illuminate\Http\JsonResponse;

class KioskHeartbeatController extends Controller
{
    public function beat(
        HeartbeatRequest $request,
        HeartbeatKioskAction $heartbeat,
    ): JsonResponse {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        $updated = $heartbeat($device, [
            'app_version' => $request->validated('app_version'),
            'battery_percent' => $request->validated('battery_percent'),
            'ip_address' => $request->validated('ip_address') ?? $request->ip(),
            'device_info' => $request->validated('device_info'),
        ]);

        return response()->json([
            'data' => [
                'server_time' => now()->toIso8601String(),
                'idle_timeout_seconds' => (int) $updated->idle_timeout_seconds,
            ],
        ]);
    }
}
