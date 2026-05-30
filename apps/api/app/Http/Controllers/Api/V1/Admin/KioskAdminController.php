<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class KioskAdminController extends Controller
{
    public function devices(): AnonymousResourceCollection
    {
        $devices = KioskDevice::query()
            ->orderByDesc('last_heartbeat_at')
            ->get();

        return JsonResource::collection($devices);
    }

    public function disableDevice(KioskDevice $device): JsonResource
    {
        $device->update(['status' => 'disabled']);

        return new JsonResource($device->fresh());
    }

    public function pairingCodes(): AnonymousResourceCollection
    {
        $codes = KioskPairingCode::query()
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get();

        return JsonResource::collection($codes);
    }

    public function createPairingCode(Request $request): JsonResource
    {
        $data = $request->validate([
            'label' => ['nullable', 'string', 'max:80'],
            'ttl_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
        ]);

        $code = (string) random_int(100000, 999999);
        $ttl = (int) ($data['ttl_minutes'] ?? 15);

        $entry = KioskPairingCode::create([
            'tenant_id' => app('tenant.id'),
            'code' => $code,
            'label' => $data['label'] ?? null,
            'expires_at' => now()->addMinutes($ttl),
            'token' => (string) Str::uuid(),
        ]);

        return new JsonResource($entry);
    }

    public function revokePairingCode(KioskPairingCode $code): JsonResponse
    {
        $code->update(['expires_at' => now()]);

        return response()->json(['data' => ['message' => 'revoked']]);
    }
}
