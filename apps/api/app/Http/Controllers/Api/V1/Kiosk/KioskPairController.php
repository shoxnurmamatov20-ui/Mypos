<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Actions\PairKioskDeviceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Kiosk\PairKioskRequest;
use App\Http\Resources\V1\Kiosk\KioskDeviceResource;
use App\Http\Resources\V1\Kiosk\KioskTenantResource;
use Illuminate\Http\JsonResponse;

/**
 * Public pairing endpoint. Trades a 6-digit pairing code for a long-lived
 * device token. The plaintext token is returned exactly once; the kiosk app
 * is responsible for persisting it locally (e.g. localStorage, secure store).
 */
class KioskPairController extends Controller
{
    public function pair(
        PairKioskRequest $request,
        PairKioskDeviceAction $pair,
    ): JsonResponse {
        $result = $pair([
            'code' => (string) $request->validated('code'),
            'device_name' => (string) $request->validated('device_name'),
            'device_info' => $request->validated('device_info'),
            'ip_address' => $request->ip(),
        ]);

        $device = $result['device'];

        return response()->json([
            'data' => [
                'device_token' => $result['plain_token'],
                'device' => KioskDeviceResource::make($device),
                'tenant' => KioskTenantResource::make($device->tenant),
            ],
        ], 201);
    }
}
