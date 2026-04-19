<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Order;

use App\Domain\Order\Actions\CreateOrderAction;
use App\Domain\Order\Actions\UpdateOrderStatusAction;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Order\CreateOrderRequest;
use App\Http\Resources\V1\Order\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()
            ->with(['items', 'table'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('table_id')) {
            $query->where('table_id', $request->string('table_id'));
        }
        if ($request->boolean('active_only')) {
            $query->whereNotIn('status', ['completed', 'cancelled', 'refunded']);
        }

        $perPage = min((int) $request->integer('per_page', 30), 200);

        return OrderResource::collection($query->paginate($perPage));
    }

    public function show(Order $order): OrderResource
    {
        return OrderResource::make($order->load(['items', 'table']));
    }

    public function store(CreateOrderRequest $request, CreateOrderAction $create): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        $order = $create($user, $request->validated());

        return response()->json(
            ['data' => OrderResource::make($order)],
            201,
        );
    }

    public function updateStatus(
        Request $request,
        Order $order,
        UpdateOrderStatusAction $updateStatus,
    ): OrderResource {
        $validated = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
        ]);
        $next = OrderStatus::from($validated['status']);

        $updated = $updateStatus($order, $next);

        return OrderResource::make($updated);
    }
}
