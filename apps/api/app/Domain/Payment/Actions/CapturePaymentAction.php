<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Events\Payment\PaymentCaptured;
use Illuminate\Support\Facades\DB;

class CapturePaymentAction
{
    /**
     * Mark a Payment as captured, then sync its Order.
     */
    public function __invoke(Payment $payment): Payment
    {
        $wasAlreadyCaptured = $payment->status === PaymentStatus::Captured->value;

        $captured = DB::transaction(function () use ($payment, $wasAlreadyCaptured): Payment {
            if (! $wasAlreadyCaptured) {
                $payment->update([
                    'status' => PaymentStatus::Captured->value,
                    'captured_at' => now(),
                ]);
            }

            $order = $payment->order;
            if ($order !== null && ! $wasAlreadyCaptured) {
                $newPaid = (int) $order->paid_amount + (int) $payment->amount;
                $updates = [
                    'paid_amount' => $newPaid,
                    'payment_method' => $payment->provider,
                ];

                if ($newPaid >= (int) $order->total_amount) {
                    $updates['payment_status'] = 'paid';
                    $updates['paid_at'] = now();
                } elseif ($newPaid > 0) {
                    $updates['payment_status'] = 'partial';
                }

                $order->update($updates);
            }

            return $payment->fresh() ?? $payment;
        });

        // Broadcast only on the actual capture transition — idempotent retries
        // don't fan-out a duplicate "ka-ching" to the dashboard.
        if (! $wasAlreadyCaptured) {
            PaymentCaptured::dispatch($captured);
        }

        return $captured;
    }
}
