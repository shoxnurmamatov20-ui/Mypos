<?php

declare(strict_types=1);

namespace App\Domain\Payment\Providers;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Click.uz integration.
 *
 * Two-phase webhook:
 *   action=0 — prepare
 *   action=1 — complete
 *
 * Signature (MD5):
 *   md5(click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time)
 *   md5(click_trans_id + service_id + secret_key + merchant_trans_id + merchant_prepare_id + amount + action + sign_time) on complete
 *
 * Stub-mode: when credentials are missing we accept fake signatures ONLY in
 * local/testing environments AND only when `payment.allow_stub_webhooks=true`.
 * Production refuses stub mode unconditionally — see C3 fix in SECURITY.md.
 */
class ClickProvider implements PaymentProviderInterface
{
    public const ACTION_PREPARE = 0;

    public const ACTION_COMPLETE = 1;

    public const ERROR_SUCCESS = 0;

    public const ERROR_SIGN_CHECK = -1;

    public const ERROR_AMOUNT = -2;

    public const ERROR_ACTION = -3;

    public const ERROR_ALREADY_PAID = -4;

    public const ERROR_USER_NOT_FOUND = -5;

    public const ERROR_TRANSACTION_NOT_FOUND = -6;

    public const ERROR_CANCELLED = -9;

    public function key(): string
    {
        return PaymentProvider::Click->value;
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{payment_url: string, transaction_id: string|null}
     */
    public function createIntent(Order $order, array $options = []): array
    {
        $serviceId = (string) config('services.click.service_id', 'test_service');
        $merchantId = (string) config('services.click.merchant_id', 'test_merchant');

        $url = sprintf(
            'https://my.click.uz/services/pay?service_id=%s&merchant_id=%s&amount=%d&transaction_param=%s',
            urlencode($serviceId),
            urlencode($merchantId),
            $order->total_amount,
            urlencode($order->id),
        );

        return [
            'payment_url' => $url,
            'transaction_id' => null,
        ];
    }

    public function verifyWebhook(Request $request): bool
    {
        $secretKey = (string) config('services.click.secret_key', '');

        if ($secretKey === '') {
            // SECURITY (C3): refuse stub mode in production regardless of any
            // feature flag — an empty CLICK_SECRET_KEY here means the operator
            // forgot to configure credentials, NOT a license to mark orders
            // paid for free.
            if (app()->environment('production')) {
                Log::critical('Click webhook secret not configured in production', [
                    'ip' => $request->ip(),
                    'click_trans_id' => (string) $request->input('click_trans_id', ''),
                ]);

                throw new RuntimeException('Click webhook secret not configured in production');
            }

            // Non-production: stub mode requires an explicit feature flag so the
            // operator has to opt in. Default = false.
            if (
                app()->environment(['local', 'testing'])
                && (bool) config('payment.allow_stub_webhooks', false) === true
            ) {
                return $this->stubSignatureValid($request);
            }

            // Any other environment (staging/dr/etc.) or flag-off: refuse.
            Log::warning('Click webhook stub mode refused', [
                'env' => app()->environment(),
                'ip' => $request->ip(),
            ]);

            return false;
        }

        $provided = (string) $request->input('sign_string', '');
        $expected = $this->computeSignature($request, $secretKey);

        return hash_equals($expected, $provided);
    }

    public function handleWebhook(Request $request): Payment
    {
        $action = (int) $request->input('action', -1);
        $orderId = (string) $request->input('merchant_trans_id', '');
        $clickTransId = (string) $request->input('click_trans_id', '');

        return DB::transaction(function () use ($action, $orderId, $clickTransId, $request) {
            // Idempotency: same click_trans_id → same Payment row
            $payment = Payment::withoutGlobalScopes()
                ->where('provider', PaymentProvider::Click->value)
                ->where('provider_transaction_id', $clickTransId)
                ->first();

            if ($payment === null) {
                // merchant_trans_id is attacker-controlled; orders.id is a
                // real uuid column on Postgres — non-uuid input would raise
                // SQLSTATE 22P02 instead of missing quietly. Treat it as
                // order-not-found.
                $order = Str::isUuid($orderId)
                    ? Order::withoutGlobalScopes()->find($orderId)
                    : null;
                if ($order === null) {
                    // SECURITY (C3): refuse poison-tenant rows.  Previously this
                    // path persisted a Payment with a placeholder zero-UUID
                    // tenant_id which contaminated all `tenant_id IS NULL`-ish
                    // queries.  We log the bad request and abort with HTTP 422
                    // so Click sees a clear error and we keep the table clean.
                    Log::warning('Click webhook: order not found, refusing to create poison-tenant Payment', [
                        'click_trans_id' => $clickTransId,
                        'merchant_trans_id' => $orderId,
                        'ip' => $request->ip(),
                    ]);

                    throw new HttpException(
                        422,
                        'Click webhook references unknown order: '.($orderId !== '' ? $orderId : '<empty>'),
                    );
                }

                $payment = Payment::withoutGlobalScopes()->create([
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'provider' => PaymentProvider::Click->value,
                    'provider_transaction_id' => $clickTransId,
                    'amount' => (int) ($request->input('amount', 0)),
                    'currency' => 'UZS',
                    'status' => PaymentStatus::Pending->value,
                    'raw_request' => $request->all(),
                ]);
            }

            if ($action === self::ACTION_PREPARE) {
                $payment->update([
                    'status' => PaymentStatus::Authorized->value,
                    'authorized_at' => $payment->authorized_at ?? now(),
                    'raw_request' => $request->all(),
                ]);
            } elseif ($action === self::ACTION_COMPLETE) {
                // Cancelled by Click?
                if ((int) $request->input('error', 0) < 0) {
                    $payment->update([
                        'status' => PaymentStatus::Cancelled->value,
                        'failure_reason' => (string) $request->input('error_note', 'Click cancelled'),
                        'raw_request' => $request->all(),
                    ]);
                } else {
                    // Record the payload only — the Captured transition
                    // belongs to CapturePaymentAction (controller-invoked),
                    // which also syncs the Order and broadcasts. Flipping the
                    // status here made the action see "already captured" and
                    // skip the order sync, leaving paid orders `unpaid`.
                    $payment->update([
                        'raw_request' => $request->all(),
                    ]);
                }
            }

            return $payment->fresh() ?? $payment;
        });
    }

    public function refund(Payment $payment, int $amountMinor): Payment
    {
        // Real Click refund would POST to https://api.click.uz/v2/merchant/payment/reversal/{payment_id}
        // For MVP we mark locally refunded.
        $payment->update([
            'status' => PaymentStatus::Refunded->value,
            'refunded_at' => now(),
        ]);

        return $payment->fresh() ?? $payment;
    }

    /**
     * Compose the Click JSON-shaped response for webhook acknowledgement.
     *
     * @return array<string, mixed>
     */
    public function respondToWebhook(Request $request, Payment $payment): array
    {
        $action = (int) $request->input('action', -1);
        $error = self::ERROR_SUCCESS;
        $errorNote = 'Success';

        if ($payment->status === PaymentStatus::Failed->value) {
            $error = self::ERROR_TRANSACTION_NOT_FOUND;
            $errorNote = $payment->failure_reason ?? 'Error';
        }

        $response = [
            'click_trans_id' => (int) $request->input('click_trans_id', 0),
            'merchant_trans_id' => (string) $request->input('merchant_trans_id', ''),
            'error' => $error,
            'error_note' => $errorNote,
        ];

        if ($action === self::ACTION_PREPARE) {
            $response['merchant_prepare_id'] = (int) substr((string) preg_replace('/\D/', '', (string) $payment->id), 0, 9);
        } elseif ($action === self::ACTION_COMPLETE) {
            $response['merchant_confirm_id'] = (int) substr((string) preg_replace('/\D/', '', (string) $payment->id), 0, 9);
        }

        return $response;
    }

    private function computeSignature(Request $request, string $secretKey): string
    {
        $action = (int) $request->input('action', 0);
        $parts = [
            (string) $request->input('click_trans_id', ''),
            (string) $request->input('service_id', ''),
            $secretKey,
            (string) $request->input('merchant_trans_id', ''),
        ];

        if ($action === self::ACTION_COMPLETE) {
            $parts[] = (string) $request->input('merchant_prepare_id', '');
        }

        $parts[] = (string) $request->input('amount', '');
        $parts[] = (string) $action;
        $parts[] = (string) $request->input('sign_time', '');

        return md5(implode('', $parts));
    }

    /**
     * Stub signature — accepts when client sends "stub_ok" as the sign_string.
     * Used locally when CLICK_SECRET_KEY is not configured.
     */
    private function stubSignatureValid(Request $request): bool
    {
        return (string) $request->input('sign_string', '') === 'stub_ok';
    }
}
