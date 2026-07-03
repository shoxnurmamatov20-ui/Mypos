<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Domain\Payment\Actions\CapturePaymentAction;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\PaymentManager;
use App\Domain\Payment\Providers\PaymeProvider;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class PaymeWebhookController extends Controller
{
    public function handle(
        Request $request,
        PaymentManager $manager,
        CapturePaymentAction $capture,
    ): JsonResponse {
        /** @var PaymeProvider $provider */
        $provider = $manager->driver('payme');

        if (! $provider->verifyWebhook($request)) {
            return response()->json($provider->respondToWebhook($request, null, [
                'code' => PaymeProvider::ERR_INVALID_AUTH,
                'message' => 'Invalid authorization',
            ]), 200);
        }


        // RLS: provider webhooks are signature-verified machine calls that
        // locate payments/orders across tenants — imprint the DB wildcard
        // for this request (reset by SetTenantContext::terminate()).
        \App\Support\TenantGuc::imprint(\App\Support\TenantGuc::WILDCARD);

        $method = (string) $request->input('method', '');
        $params = (array) $request->input('params', []);

        try {
            $payment = $provider->handleWebhook($request);
        } catch (Throwable $e) {
            // Payme's JSON-RPC spec keys the error code off the METHOD:
            // CreateTransaction with an unknown order must answer -31008
            // (cannot perform), not the blanket -31003 (txn not found).
            return response()->json($provider->respondToWebhook($request, null, [
                'code' => $this->errorCodeFor($method),
                'message' => $e->getMessage(),
            ]), 200);
        }

        $result = match ($method) {
            'CheckPerformTransaction' => $this->checkPerformResult($payment),
            'CreateTransaction' => [
                'create_time' => (int) ($payment->authorized_at?->valueOf() ?? now()->valueOf()),
                'transaction' => (string) $payment->id,
                'state' => $provider->stateFor($payment),
            ],
            'PerformTransaction' => $this->afterPerform($payment, $capture, $provider),
            'CancelTransaction' => [
                'transaction' => (string) $payment->id,
                'cancel_time' => (int) (($payment->refunded_at ?? $payment->updated_at)?->valueOf() ?? now()->valueOf()),
                'state' => $provider->stateFor($payment),
            ],
            'CheckTransaction' => [
                'create_time' => (int) ($payment->authorized_at?->valueOf() ?? 0),
                'perform_time' => (int) ($payment->captured_at?->valueOf() ?? 0),
                'cancel_time' => (int) ($payment->refunded_at?->valueOf() ?? 0),
                'transaction' => (string) $payment->id,
                'state' => $provider->stateFor($payment),
                'reason' => $payment->failure_reason !== null && $payment->failure_reason !== '' ? 1 : null,
            ],
            default => null,
        };

        if ($result === null) {
            return response()->json($provider->respondToWebhook($request, null, [
                'code' => PaymeProvider::ERR_INVALID_REQUEST,
                'message' => 'Unsupported method',
            ]), 200);
        }

        if ($payment->status === PaymentStatus::Failed->value) {
            return response()->json($provider->respondToWebhook($request, null, [
                'code' => $this->errorCodeFor($method),
                'message' => $payment->failure_reason ?? 'Error',
            ]), 200);
        }

        return response()->json($provider->respondToWebhook($request, $result), 200);
    }

    /**
     * @return array<string, mixed>
     */
    private function checkPerformResult(Payment $payment): array
    {
        return [
            'allow' => $payment->status !== PaymentStatus::Failed->value,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function afterPerform(
        Payment $payment,
        CapturePaymentAction $capture,
        PaymeProvider $provider,
    ): array {
        // Unconditional: the action owns the Captured transition AND the
        // order sync. It is idempotent — a Payme retry on an already-captured
        // payment neither double-credits the order nor re-broadcasts.
        if ($payment->status !== PaymentStatus::Failed->value) {
            $payment = $capture($payment);
        }

        return [
            'transaction' => (string) $payment->id,
            'perform_time' => (int) (($payment->captured_at ?? now())->valueOf()),
            'state' => $provider->stateFor($payment->fresh() ?? $payment),
        ];
    }

    private function errorCodeFor(string $method): int
    {
        return match ($method) {
            'CheckPerformTransaction' => PaymeProvider::ERR_ORDER_NOT_FOUND,
            'CreateTransaction' => PaymeProvider::ERR_CANNOT_PERFORM,
            'PerformTransaction', 'CancelTransaction', 'CheckTransaction' => PaymeProvider::ERR_TRANSACTION_NOT_FOUND,
            default => PaymeProvider::ERR_INVALID_REQUEST,
        };
    }
}
