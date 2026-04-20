<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Order;

use App\Domain\Order\Actions\CreateOrderAction;
use App\Domain\Order\Actions\UpdateOrderStatusAction;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Domain\Table\Models\Table;
use App\Events\Order\OrderPlaced;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Order\CreateOrderRequest;
use App\Http\Resources\V1\Order\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        OrderPlaced::dispatch($order);

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

    /**
     * Aggregated business metrics for dashboards.
     *
     * GET /api/v1/orders/stats/summary?from={iso}&to={iso}
     */
    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])->endOfDay()
            : Carbon::now()->endOfDay();
        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'])->startOfDay()
            : $to->copy()->subDays(29)->startOfDay();

        $baseQuery = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded']);

        $totals = (clone $baseQuery)
            ->selectRaw('COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue')
            ->first();

        $totalOrders = (int) ($totals->total_orders ?? 0);
        $totalRevenue = (int) ($totals->total_revenue ?? 0);
        $avgOrderValue = $totalOrders > 0 ? (int) round($totalRevenue / $totalOrders) : 0;

        return response()->json([
            'data' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'avg_order_value' => $avgOrderValue,
                'orders_by_status' => $this->ordersByStatus($from, $to),
                'daily_revenue' => $this->dailyRevenue($baseQuery, $from, $to),
                'top_items' => $this->topItems($from, $to),
                'top_tables' => $this->topTables($from, $to),
                'payment_methods' => $this->paymentMethods($from, $to),
            ],
        ]);
    }

    /** @return array<string, int> */
    private function ordersByStatus(Carbon $from, Carbon $to): array
    {
        $defaults = [
            'pending' => 0,
            'preparing' => 0,
            'ready' => 0,
            'served' => 0,
            'completed' => 0,
            'cancelled' => 0,
        ];

        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('status, COUNT(*) AS cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->all();

        foreach ($rows as $status => $cnt) {
            if (array_key_exists($status, $defaults)) {
                $defaults[$status] = (int) $cnt;
            }
        }

        return $defaults;
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder $baseQuery
     * @return list<array{date: string, orders: int, revenue: int}>
     */
    private function dailyRevenue($baseQuery, Carbon $from, Carbon $to): array
    {
        $rows = (clone $baseQuery)
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM-DD') AS day, COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $result = [];
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();
        while ($cursor->lessThanOrEqualTo($end)) {
            $key = $cursor->format('Y-m-d');
            $row = $rows->get($key);
            $result[] = [
                'date' => $key,
                'orders' => $row ? (int) $row->orders : 0,
                'revenue' => $row ? (int) $row->revenue : 0,
            ];
            $cursor->addDay();
        }

        return $result;
    }

    /**
     * @return list<array{menu_item_id: string|null, name: string, count: int, revenue: int}>
     */
    private function topItems(Carbon $from, Carbon $to): array
    {
        $rows = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotIn('orders.status', ['draft', 'cancelled', 'refunded'])
            ->selectRaw('order_items.menu_item_id, order_items.name_snapshot AS name, SUM(order_items.quantity) AS cnt, SUM(order_items.subtotal_amount) AS revenue')
            ->groupBy('order_items.menu_item_id', 'order_items.name_snapshot')
            ->orderByDesc('cnt')
            ->limit(5)
            ->get();

        return $rows->map(fn ($r) => [
            'menu_item_id' => $r->menu_item_id,
            'name' => (string) $r->name,
            'count' => (int) $r->cnt,
            'revenue' => (int) $r->revenue,
        ])->all();
    }

    /**
     * @return list<array{table_id: string|null, name: string, orders: int, revenue: int}>
     */
    private function topTables(Carbon $from, Carbon $to): array
    {
        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('table_id')
            ->leftJoin('tables', 'orders.table_id', '=', 'tables.id')
            ->selectRaw('orders.table_id, tables.name AS table_name, COUNT(*) AS orders_count, COALESCE(SUM(orders.total_amount), 0) AS revenue')
            ->groupBy('orders.table_id', 'tables.name')
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get();

        return $rows->map(fn ($r) => [
            'table_id' => $r->table_id,
            'name' => (string) ($r->table_name ?? ''),
            'orders' => (int) $r->orders_count,
            'revenue' => (int) $r->revenue,
        ])->all();
    }

    /**
     * @return list<array{method: string, count: int, revenue: int}>
     */
    private function paymentMethods(Carbon $from, Carbon $to): array
    {
        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded'])
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, COUNT(*) AS cnt, COALESCE(SUM(paid_amount), 0) AS revenue')
            ->groupBy('payment_method')
            ->orderByDesc('cnt')
            ->get();

        return $rows->map(fn ($r) => [
            'method' => (string) $r->payment_method,
            'count' => (int) $r->cnt,
            'revenue' => (int) $r->revenue,
        ])->all();
    }
}
