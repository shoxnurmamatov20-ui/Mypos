<?php

declare(strict_types=1);

namespace App\Domain\Order\Actions;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Domain\Table\Models\Table;
use Illuminate\Validation\ValidationException;

class UpdateOrderStatusAction
{
    public function __invoke(Order $order, OrderStatus $next): Order
    {
        $current = OrderStatus::from($order->status);

        if (! $current->canTransitionTo($next)) {
            throw ValidationException::withMessages([
                'status' => ["{$current->label()} → {$next->label()} holat o'tishi mumkin emas"],
            ]);
        }

        $updates = ['status' => $next->value];

        switch ($next) {
            case OrderStatus::Preparing:
                // no timestamp; placed_at already set
                break;
            case OrderStatus::Ready:
                $updates['prepared_at'] = now();
                break;
            case OrderStatus::Served:
                $updates['served_at'] = now();
                break;
            case OrderStatus::Completed:
                $updates['completed_at'] = now();
                if ($order->payment_status === 'unpaid') {
                    $updates['payment_status'] = 'paid';
                    $updates['paid_at'] = now();
                    $updates['paid_amount'] = $order->total_amount;
                }
                // Free table when completed
                if ($order->table_id !== null) {
                    Table::query()->where('id', $order->table_id)->update(['status' => 'available']);
                }
                break;
            case OrderStatus::Cancelled:
                $updates['cancelled_at'] = now();
                if ($order->table_id !== null) {
                    Table::query()->where('id', $order->table_id)->update(['status' => 'available']);
                }
                break;
            case OrderStatus::Refunded:
                $updates['payment_status'] = 'refunded';
                break;
            default:
                break;
        }

        $order->update($updates);

        return $order->fresh(['items', 'table']);
    }
}
