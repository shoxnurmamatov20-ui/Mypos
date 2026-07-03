<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Domain\Payment\Actions\CapturePaymentAction;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\PaymentManager;
use App\Domain\Payment\Providers\ClickProvider;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClickWebhookController extends Controller
{
    public function handle(
        Request $request,
        PaymentManager $manager,
        CapturePaymentAction $capture,
    ): JsonResponse {
        /** @var ClickProvider $provider */
        $provider = $manager->driver('click');

        if (! $provider->verifyWebhook($request)) {
            return response()->json([
                'click_trans_id' => (int) $request->input('click_trans_id', 0),
                'merchant_trans_id' => (string) $request->input('merchant_trans_id', ''),
                'error' => ClickProvider::ERROR_SIGN_CHECK,
                'error_note' => 'SIGN CHECK FAILED!',
            ], 200);
        }

        $payment = $provider->handleWebhook($request);

        // COMPLETE with a non-negative error code → finalize through the
        // action: it owns the Captured transition, the Order sync
        // (paid_amount / payment_status) and the one-time broadcast.
        // Idempotent for Click's retries of already-captured payments.
        $action = (int) $request->input('action', -1);
        if ($action === ClickProvider::ACTION_COMPLETE
            && $payment->status !== PaymentStatus::Cancelled->value
            && $payment->status !== PaymentStatus::Failed->value
        ) {
            $payment = $capture($payment);
        }

        return response()->json($provider->respondToWebhook($request, $payment), 200);
    }
}
