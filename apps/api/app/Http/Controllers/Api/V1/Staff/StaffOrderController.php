<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Actions\CreateOrderAction;
use App\Domain\Order\Actions\UpdateOrderStatusAction;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Events\Order\OrderPlaced;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Staff\CreateStaffOrderRequest;
use App\Http\Requests\V1\Staff\UpdateOrderStatusRequest;
use App\Http\Resources\V1\Order\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffOrderController extends Controller
{
    /**
     * GET /api/v1/staff/orders/my
     */
    public function myOrders(Request $request): AnonymousResourceCollection
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');
        $userUuid = $request->user()?->uuid;

        $query = Order::query()
            ->with(['items', 'table'])
            ->where(function ($q) use ($employee, $userUuid): void {
                $q->where('served_by_id', $employee->id);
                if ($userUuid !== null) {
                    $q->orWhere('employee_id', $userUuid);
                }
            })
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $statuses = collect(explode(',', (string) $request->string('status')))
                ->map(fn (string $s): string => trim($s))
                ->filter()
                ->values()
                ->all();
            if ($statuses !== []) {
                $query->whereIn('status', $statuses);
            }
        }

        $perPage = min((int) $request->integer('per_page', 20), 100);

        return OrderResource::collection($query->paginate($perPage));
    }

    /**
     * POST /api/v1/staff/orders
     */
    public function store(CreateStaffOrderRequest $request, CreateOrderAction $create): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');
        $user = $request->user();
        abort_if($user === null, 401);

        $order = $create($user, $request->validated());

        $order->update(['served_by_id' => $employee->id]);

        OrderPlaced::dispatch($order);

        return response()->json(
            ['data' => OrderResource::make($order->fresh(['items', 'table']))],
            201,
        );
    }

    /**
     * PATCH /api/v1/staff/orders/{order}/status
     */
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order,
        UpdateOrderStatusAction $updateStatus,
    ): JsonResponse {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');
        $userUuid = $request->user()?->uuid;

        $isOwner = $order->served_by_id === $employee->id || $order->employee_id === $userUuid;
        $role = EmployeeRole::tryFrom($employee->position);
        $isManager = $role?->isManagerial() ?? false;

        if (! $isOwner && ! $isManager) {
            return response()->json([
                'message' => __('Bu buyurtmani o\'zgartirishga ruxsat yo\'q'),
            ], 403);
        }

        $next = OrderStatus::from($request->validated('status'));

        if ($next === OrderStatus::Cancelled) {
            $reason = (string) $request->validated('reason');
            $metadata = $order->metadata ?? [];
            $metadata['cancelled_reason'] = $reason;
            $metadata['cancelled_by'] = $employee->id;
            $order->update(['metadata' => $metadata]);
        }

        $updated = $updateStatus($order, $next);

        return response()->json(
            ['data' => OrderResource::make($updated)],
        );
    }
}
