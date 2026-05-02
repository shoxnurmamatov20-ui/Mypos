<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Payment;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Actions\CapturePaymentAction;
use App\Domain\Payment\Actions\CreatePaymentIntentAction;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\PaymentManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Payment\CreatePaymentIntentRequest;
use App\Http\Requests\V1\Payment\RefundPaymentRequest;
use App\Http\Resources\V1\Payment\PaymentResource;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function store(
        CreatePaymentIntentRequest $request,
        CreatePaymentIntentAction $create,
    ): JsonResponse {
        $this->authorize('create', Payment::class);

        $data = $request->validated();

        $order = Order::query()->findOrFail($data['order_id']);
        // Re-check that the actor may pay for this specific order
        // (within-tenant scoping + role).
        $this->authorize('confirmPayment', $order);

        $provider = PaymentProvider::from($data['provider']);

        $result = $create($order, $provider, $data['options'] ?? []);

        return response()->json([
            'data' => [
                'payment' => PaymentResource::make($result['payment']),
                'payment_url' => $result['payment_url'],
                'transaction_id' => $result['transaction_id'],
            ],
        ], 201);
    }

    public function show(Payment $payment): PaymentResource
    {
        $this->authorize('view', $payment);

        return PaymentResource::make($payment);
    }

    public function captureCash(Payment $payment, CapturePaymentAction $capture): PaymentResource
    {
        $this->authorize('capture', $payment);

        abort_unless($payment->provider === PaymentProvider::Cash->value, 422, 'Only cash payments can be captured manually.');

        $captured = $capture($payment);

        return PaymentResource::make($captured);
    }

    public function refund(
        RefundPaymentRequest $request,
        Payment $payment,
        PaymentManager $manager,
    ): PaymentResource {
        $amount = (int) $request->validated()['amount'];

        // Pass amount so the policy can apply the LARGE_REFUND_THRESHOLD escalation.
        $this->authorize('refund', [$payment, $amount]);

        $provider = $manager->driver($payment->provider);
        $refunded = $provider->refund($payment, $amount);

        return PaymentResource::make($refunded);
    }
}
