<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Domain\Kiosk\Actions\CreateKioskPaymentAction;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Actions\CapturePaymentAction;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Models\Payment;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Kiosk\CreateKioskPaymentRequest;
use App\Http\Resources\V1\Payment\PaymentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Kiosk-scoped payment flow. Mirrors `/api/v1/payments` but enforces that the
 * order belongs to the calling device on both creation and capture.
 */
class KioskPaymentController extends Controller
{
    public function create(
        CreateKioskPaymentRequest $request,
        CreateKioskPaymentAction $create,
    ): JsonResponse {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        $orderId = (string) $request->validated('order_id');
        $provider = PaymentProvider::from((string) $request->validated('provider'));

        $result = $create($device, $orderId, $provider);

        return response()->json([
            'data' => [
                'payment' => PaymentResource::make($result['payment']),
                'payment_url' => $result['payment_url'],
                'transaction_id' => $result['transaction_id'],
            ],
        ], 201);
    }

    public function capture(
        Request $request,
        string $payment,
        CapturePaymentAction $capture,
    ): PaymentResource {
        /** @var KioskDevice $device */
        $device = $request->attributes->get('kiosk_device');

        $found = Payment::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('id', $payment)
            ->first();

        if ($found === null) {
            throw new NotFoundHttpException(__('To\'lov topilmadi'));
        }

        // Ensure the underlying order is owned by this device. Resolve order
        // explicitly without global tenant scope (no auth user in this flow).
        $order = Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('id', $found->order_id)
            ->first();

        if ($order === null || $order->kiosk_device_id !== $device->id) {
            throw new NotFoundHttpException(__('To\'lov topilmadi'));
        }

        $captured = $capture($found);

        return PaymentResource::make($captured);
    }
}
