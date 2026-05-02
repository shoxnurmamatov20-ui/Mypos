<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Models\Order;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Kiosk\KioskOrderResource;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Polled by the kiosk receipt screen to track preparation progress.
 * Returns 404 (not 403) for any order not owned by the calling device, to
 * avoid leaking the existence of orders across kiosks.
 */
class KioskOrderStatusController extends Controller
{
    public function show(Request $request, string $order): KioskOrderResource
    {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        $found = Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('id', $order)
            ->where('kiosk_device_id', $device->id)
            ->with(['items'])
            ->first();

        if ($found === null) {
            throw new NotFoundHttpException(__('Buyurtma topilmadi'));
        }

        return KioskOrderResource::make($found);
    }
}
