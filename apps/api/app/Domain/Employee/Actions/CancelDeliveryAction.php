<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Enums\DeliveryCancelReason;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Events\Order\OrderStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Courier-side delivery cancellation.
 *
 * - Marks the order cancelled (status, cancelled_at).
 * - Stores the reason + free-text notes in metadata.delivery_cancel_*
 * - Prepends a "[Courier cancelled]" line to order.notes for visibility.
 * - Keeps courier_id intact so the cancellation is tied to a specific courier.
 */
class CancelDeliveryAction
{
    public function __invoke(
        Employee $courier,
        Order $order,
        DeliveryCancelReason $reason,
        ?string $notes = null,
    ): Order {
        if ($order->courier_id !== $courier->id) {
            throw ValidationException::withMessages([
                'order' => [__('Bu buyurtma sizga tayinlanmagan')],
            ])->status(403);
        }

        if ($order->type !== 'delivery') {
            throw ValidationException::withMessages([
                'order' => [__('Bu buyurtma yetkazib berish turi emas')],
            ]);
        }

        if ($order->delivered_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Allaqachon yetkazilgan buyurtmani bekor qilib bo\'lmaydi')],
            ]);
        }

        if ($order->cancelled_at !== null) {
            throw ValidationException::withMessages([
                'order' => [__('Buyurtma allaqachon bekor qilingan')],
            ]);
        }

        $oldStatus = $order->status;

        $fresh = DB::transaction(function () use ($order, $reason, $notes, $courier): Order {
            $metadata = $order->metadata ?? [];
            $metadata['delivery_cancel_reason'] = $reason->value;
            $metadata['delivery_cancel_notes'] = $notes;
            $metadata['delivery_cancelled_by'] = $courier->id;

            $stamp = '[' . __('Kuryer bekor qildi') . ' / ' . $reason->label() . ']';
            $newNotes = trim($stamp . ($notes !== null && $notes !== '' ? ' ' . $notes : '') . "\n" . ($order->notes ?? ''));

            $order->update([
                'status' => OrderStatus::Cancelled->value,
                'cancelled_at' => now(),
                'metadata' => $metadata,
                'notes' => $newNotes,
            ]);

            return $order->fresh(['items', 'courier', 'customer']) ?? $order;
        });

        OrderStatusChanged::dispatch($fresh, $oldStatus, OrderStatus::Cancelled->value);

        return $fresh;
    }
}
