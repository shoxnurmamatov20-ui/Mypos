<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Actions;

use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Order\Models\Order;
use App\Domain\Payment\Actions\CreatePaymentIntentAction;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Models\Payment;
use Illuminate\Validation\ValidationException;

/**
 * Validates that the target order belongs to the calling kiosk device,
 * then delegates to the shared {@see CreatePaymentIntentAction}. Returns the
 * same shape ({payment, payment_url, transaction_id}) as the staff-facing
 * payments endpoint so the kiosk SDK can stay aligned.
 */
class CreateKioskPaymentAction
{
    public function __construct(
        private readonly CreatePaymentIntentAction $createIntent,
    ) {}

    /**
     * @return array{payment: Payment, payment_url: string|null, transaction_id: string|null}
     */
    public function __invoke(KioskDevice $device, string $orderId, PaymentProvider $provider): array
    {
        $order = Order::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('tenant_id', $device->tenant_id)
            ->where('id', $orderId)
            ->first();

        if ($order === null) {
            throw ValidationException::withMessages([
                'order_id' => [__('Buyurtma topilmadi')],
            ]);
        }

        if ($order->kiosk_device_id !== $device->id) {
            throw ValidationException::withMessages([
                'order_id' => [__('Bu buyurtma boshqa kioskka tegishli')],
            ]);
        }

        return ($this->createIntent)($order, $provider);
    }
}
