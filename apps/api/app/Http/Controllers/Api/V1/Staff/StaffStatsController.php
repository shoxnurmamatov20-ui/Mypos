<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Models\OrderItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class StaffStatsController extends Controller
{
    /**
     * GET /api/v1/staff/stats?period=today|week|month
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['nullable', 'string', Rule::in(['today', 'week', 'month'])],
        ]);

        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');
        $period = $validated['period'] ?? 'today';
        [$from, $to] = $this->resolveRange($period);

        $orders = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->where('served_by_id', $employee->id)
            ->whereNotIn('status', ['draft', 'cancelled', 'refunded']);

        $totals = (clone $orders)
            ->selectRaw('COUNT(*) AS cnt, COALESCE(SUM(total_amount), 0) AS revenue, COALESCE(SUM(tip_amount), 0) AS tips')
            ->first();

        $orderCount = (int) ($totals->cnt ?? 0);
        $revenue = (int) ($totals->revenue ?? 0);
        $tips = (int) ($totals->tips ?? 0);
        $avg = $orderCount > 0 ? (int) round($revenue / $orderCount) : 0;

        $itemsPrepared = (int) OrderItem::query()
            ->where('cook_id', $employee->id)
            ->whereBetween('ready_at', [$from, $to])
            ->whereNotNull('ready_at')
            ->sum('quantity');

        $shiftMinutes = (int) Shift::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('actual_start', [$from, $to])
            ->whereNotNull('actual_start')
            ->get()
            ->sum(fn (Shift $s): int => $s->workedMinutes());

        return response()->json([
            'data' => [
                'period' => $period,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'orders_count' => $orderCount,
                'revenue_minor' => $revenue,
                'tips_minor' => $tips,
                'avg_order_minor' => $avg,
                'shift_minutes' => $shiftMinutes,
                'items_prepared' => $itemsPrepared,
            ],
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(string $period): array
    {
        $now = Carbon::now();
        return match ($period) {
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };
    }
}
