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

        // On COMPLETE action with captured status → sync order
        if ($payment->status === PaymentStatus::Captured->value) {
            $capture($payment);
        }

        return response()->json($provider->respondToWebhook($request, $payment), 200);
    }
}
