<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Actions\UpdateOrderItemStatusAction;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Staff\UpdateItemStatusRequest;
use App\Http\Resources\V1\Order\OrderItemResource;
use App\Http\Resources\V1\Staff\KitchenOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffKitchenController extends Controller
{
    /**
     * GET /api/v1/staff/kitchen/queue
     *
     * Orders with at least one not-yet-ready item, sorted oldest first.
     */
    public function queue(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->integer('per_page', 30), 100);

        $orders = Order::query()
            ->whereIn('status', ['pending', 'preparing'])
            ->whereHas('items', function ($q): void {
                $q->whereNotIn('status', ['ready', 'served', 'cancelled']);
            })
            ->with([
                'table',
                'items' => function ($q): void {
                    $q->whereNotIn('status', ['served', 'cancelled'])
                        ->orderBy('created_at');
                },
                'items.cook.user',
            ])
            ->orderBy('created_at')
            ->paginate($perPage);

        return KitchenOrderResource::collection($orders);
    }

    /**
     * PATCH /api/v1/staff/orders/{order}/items/{item}/status
     */
    public function updateItemStatus(
        UpdateItemStatusRequest $request,
        Order $order,
        OrderItem $item,
        UpdateOrderItemStatusAction $action,
    ): JsonResponse {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $updated = $action(
            cook: $employee,
            order: $order,
            item: $item,
            next: (string) $request->validated('status'),
        );

        return response()->json([
            'data' => OrderItemResource::make($updated),
        ]);
    }
}
