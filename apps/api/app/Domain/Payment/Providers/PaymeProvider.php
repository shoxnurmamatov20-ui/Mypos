<?php

declare(strict_types=1);

namespace App\Domain\Payment\Providers;

use App\Domain\Order\Models\Order;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Payme (paycom.uz) integration — JSON-RPC 2.0 single endpoint.
 *
 * Methods:
 *   - CheckPerformTransaction
 *   - CreateTransaction
 *   - PerformTransaction
 *   - CancelTransaction
 *   - CheckTransaction
 *   - GetStatement
 *
 * Auth: HTTP Basic, merchant_key as password.
 */
class PaymeProvider implements PaymentProviderInterface
{
    public const ERR_INVALID_AMOUNT = -31001;
    public const ERR_ORDER_NOT_FOUND = -31050;
    public const ERR_CANNOT_PERFORM = -31008;
    public const ERR_TRANSACTION_NOT_FOUND = -31003;
    public const ERR_UNABLE_TO_CANCEL = -31007;
    public const ERR_INVALID_AUTH = -32504;
    public const ERR_INVALID_REQUEST = -32600;

    public const STATE_CREATED = 1;
    public const STATE_COMPLETED = 2;
    public const STATE_CANCELLED_AFTER_CREATE = -1;
    public const STATE_CANCELLED_AFTER_COMPLETE = -2;

    public function key(): string
    {
        return PaymentProvider::Payme->value;
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{payment_url: string, transaction_id: string|null}
     */
    public function createIntent(Order $order, array $options = []): array
    {
        $merchantId = (string) config('services.payme.merchant_id', 'test_merchant');

        // Payme expects base64-encoded params string: m=merchant_id;ac.order_id=xxx;a=amount
        $params = sprintf(
            'm=%s;ac.order_id=%s;a=%d',
            $merchantId,
            $order->id,
            $order->total_amount,
        );
        $encoded = base64_encode($params);

        $testMode = (bool) config('services.payme.test_mode', true);
        $host = $testMode ? 'https://test.paycom.uz' : 'https://checkout.paycom.uz';

        return [
            'payment_url' => $host . '/' . $encoded,
            'transaction_id' => null,
        ];
    }

    public function verifyWebhook(Request $request): bool
    {
        $authHeader = (string) $request->header('Authorization', '');
        if (! str_starts_with($authHeader, 'Basic ')) {
            return false;
        }

        $decoded = base64_decode(substr($authHeader, 6), true);
        if ($decoded === false) {
            return false;
        }

        $parts = explode(':', $decoded, 2);
        if (count($parts) !== 2) {
            return false;
        }
        [, $providedKey] = $parts;

        $expectedKey = (string) config('services.payme.secret_key', '');
        if ($expectedKey === '') {
            // Stub mode — accept any "stub_ok" password for local dev
            return $providedKey === 'stub_ok';
        }

        return hash_equals($expectedKey, $providedKey);
    }

    public function handleWebhook(Request $request): Payment
    {
        $method = (string) $request->input('method', '');
        $params = (array) $request->input('params', []);

        return match ($method) {
            'CheckPerformTransaction' => $this->checkPerform($request, $params),
            'CreateTransaction' => $this->createTransaction($request, $params),
            'PerformTransaction' => $this->performTransaction($request, $params),
            'CancelTransaction' => $this->cancelTransaction($request, $params),
            'CheckTransaction' => $this->checkTransaction($request, $params),
            default => throw new RuntimeException('Unsupported Payme method: ' . $method),
        };
    }

    public function refund(Payment $payment, int $amountMinor): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Refunded->value,
            'refunded_at' => now(),
        ]);

        return $payment->fresh() ?? $payment;
    }

    /**
     * Produce a JSON-RPC 2.0 response payload for Payme.
     *
     * @param  array<string, mixed>|null  $result
     * @param  array{code: int, message: string}|null  $error
     * @return array<string, mixed>
     */
    public function respondToWebhook(Request $request, ?array $result = null, ?array $error = null): array
    {
        $id = $request->input('id', 0);

        if ($error !== null) {
            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => [
                    'code' => $error['code'],
                    'message' => $error['message'],
                ],
            ];
        }

        return [
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result ?? (object) [],
        ];
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function checkPerform(Request $request, array $params): Payment
    {
        $orderId = (string) ($params['account']['order_id'] ?? '');
        $amount = (int) ($params['amount'] ?? 0);

        $order = Order::withoutGlobalScopes()->find($orderId);

        if ($order === null) {
            return $this->ghostPayment($request, $orderId, $amount, 'Order not found');
        }

        // Amount check (Payme sends minor-unit UZS × 100 by spec, but we use raw UZS)
        if ($order->total_amount !== $amount) {
            return $this->ghostPayment($request, $orderId, $amount, 'Amount mismatch');
        }

        // Not an actual persistence; checkPerform does NOT create rows. Reflect a synthetic pending payment.
        return new Payment([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'provider' => PaymentProvider::Payme->value,
            'amount' => $amount,
            'status' => PaymentStatus::Pending->value,
        ]);
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function createTransaction(Request $request, array $params): Payment
    {
        $orderId = (string) ($params['account']['order_id'] ?? '');
        $amount = (int) ($params['amount'] ?? 0);
        $paymeTxnId = (string) ($params['id'] ?? '');

        return DB::transaction(function () use ($request, $orderId, $amount, $paymeTxnId) {
            $existing = Payment::withoutGlobalScopes()
                ->where('provider', PaymentProvider::Payme->value)
                ->where('provider_transaction_id', $paymeTxnId)
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $order = Order::withoutGlobalScopes()->find($orderId);
            $tenantId = $order?->tenant_id ?? '00000000-0000-0000-0000-000000000000';

            return Payment::withoutGlobalScopes()->create([
                'tenant_id' => $tenantId,
                'order_id' => $orderId !== '' ? $orderId : '00000000-0000-0000-0000-000000000000',
                'provider' => PaymentProvider::Payme->value,
                'provider_transaction_id' => $paymeTxnId,
                'amount' => $amount,
                'currency' => 'UZS',
                'status' => PaymentStatus::Authorized->value,
                'authorized_at' => now(),
                'raw_request' => $request->all(),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function performTransaction(Request $request, array $params): Payment
    {
        $paymeTxnId = (string) ($params['id'] ?? '');

        $payment = Payment::withoutGlobalScopes()
            ->where('provider', PaymentProvider::Payme->value)
            ->where('provider_transaction_id', $paymeTxnId)
            ->first();

        if ($payment === null) {
            throw new RuntimeException('Payme transaction not found');
        }

        // Idempotent: already captured is fine
        if ($payment->status !== PaymentStatus::Captured->value) {
            $payment->update([
                'status' => PaymentStatus::Captured->value,
                'captured_at' => now(),
                'raw_request' => $request->all(),
            ]);
        }

        return $payment->fresh() ?? $payment;
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function cancelTransaction(Request $request, array $params): Payment
    {
        $paymeTxnId = (string) ($params['id'] ?? '');

        $payment = Payment::withoutGlobalScopes()
            ->where('provider', PaymentProvider::Payme->value)
            ->where('provider_transaction_id', $paymeTxnId)
            ->first();

        if ($payment === null) {
            throw new RuntimeException('Payme transaction not found');
        }

        if ($payment->status !== PaymentStatus::Cancelled->value && $payment->status !== PaymentStatus::Refunded->value) {
            $nextStatus = $payment->status === PaymentStatus::Captured->value
                ? PaymentStatus::Refunded->value
                : PaymentStatus::Cancelled->value;

            $payment->update([
                'status' => $nextStatus,
                'failure_reason' => (string) ($params['reason'] ?? 'Cancelled by Payme'),
                'raw_request' => $request->all(),
                'refunded_at' => $nextStatus === PaymentStatus::Refunded->value ? now() : null,
            ]);
        }

        return $payment->fresh() ?? $payment;
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function checkTransaction(Request $request, array $params): Payment
    {
        $paymeTxnId = (string) ($params['id'] ?? '');

        $payment = Payment::withoutGlobalScopes()
            ->where('provider', PaymentProvider::Payme->value)
            ->where('provider_transaction_id', $paymeTxnId)
            ->first();

        if ($payment === null) {
            throw new RuntimeException('Payme transaction not found');
        }

        return $payment;
    }

    private function ghostPayment(Request $request, string $orderId, int $amount, string $reason): Payment
    {
        return new Payment([
            'tenant_id' => '00000000-0000-0000-0000-000000000000',
            'order_id' => $orderId !== '' ? $orderId : '00000000-0000-0000-0000-000000000000',
            'provider' => PaymentProvider::Payme->value,
            'amount' => $amount,
            'currency' => 'UZS',
            'status' => PaymentStatus::Failed->value,
            'failure_reason' => $reason,
        ]);
    }

    /**
     * Map a Payment to Payme's state integer.
     */
    public function stateFor(Payment $payment): int
    {
        return match ($payment->status) {
            PaymentStatus::Authorized->value => self::STATE_CREATED,
            PaymentStatus::Captured->value => self::STATE_COMPLETED,
            PaymentStatus::Cancelled->value => self::STATE_CANCELLED_AFTER_CREATE,
            PaymentStatus::Refunded->value => self::STATE_CANCELLED_AFTER_COMPLETE,
            default => 0,
        };
    }
}
