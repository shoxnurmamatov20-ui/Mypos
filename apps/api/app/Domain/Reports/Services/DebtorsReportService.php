<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Customer\Models\Customer;
use App\Domain\Order\Models\Order;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;

/**
 * Debtors & creditors report.
 *
 * Debtors are derived synthetically from unpaid orders attached to a
 * customer — there's no dedicated `debts` table in the schema (yet). A
 * customer's "owed" amount is the sum of `total_amount - paid_amount`
 * across all their non-cancelled, non-fully-paid orders in the window.
 *
 * Creditors (people the restaurant owes — typically suppliers) will be
 * sourced from the future Expense module. The shape is reserved here so
 * the dashboard doesn't have to re-fetch when that module lands.
 */
final class DebtorsReportService
{
    use NormalizesDateRange;

    /** @return array{data: array<string, mixed>} */
    public function generate(?string $from, ?string $to): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);

        // Sargable rewrite: `payment_status IN ('unpaid', 'partial', 'pending')`
        // uses the (tenant_id, payment_status) equality index, while the old
        // `!= 'paid'` could not. Same logical filter, much faster at scale.
        $rows = Order::query()
            ->from('orders')
            ->whereBetween('orders.created_at', [$fromCarbon, $toCarbon])
            ->whereNotIn('orders.status', ['cancelled', 'refunded'])
            ->whereIn('orders.payment_status', ['unpaid', 'partial', 'pending'])
            ->whereNotNull('orders.customer_id')
            ->selectRaw(
                'orders.customer_id,
                 COUNT(*) AS orders_cnt,
                 COALESCE(SUM(orders.total_amount - orders.paid_amount), 0) AS owed,
                 MIN(orders.created_at) AS oldest_unpaid'
            )
            ->groupBy('orders.customer_id')
            ->havingRaw('COALESCE(SUM(orders.total_amount - orders.paid_amount), 0) > 0')
            ->orderByDesc('owed')
            ->limit(500)
            ->get();

        $customerIds = $rows->pluck('customer_id')->all();
        $customers = Customer::query()
            ->whereIn('id', $customerIds)
            ->get()
            ->keyBy('id');

        $debtors = $rows->map(function ($row) use ($customers): array {
            $customer = $customers->get($row->customer_id);
            return [
                'customer_id' => (string) $row->customer_id,
                'name' => $customer?->fullName() ?? '—',
                'phone' => $customer?->phone,
                'orders_count' => (int) $row->orders_cnt,
                'total_owed_minor' => (int) $row->owed,
                'oldest_unpaid_date' => $row->oldest_unpaid !== null
                    ? \Illuminate\Support\Carbon::parse((string) $row->oldest_unpaid)->toIso8601String()
                    : null,
            ];
        })->values()->all();

        $debtorsTotal = (int) array_sum(array_column($debtors, 'total_owed_minor'));

        return [
            'data' => [
                'debtors' => $debtors,
                // Creditors will land with the Expense / Supplier debt module.
                // Empty list keeps the response shape stable so the frontend
                // doesn't fork between "feature shipped" and "feature not yet".
                'creditors' => [],
                'summary' => [
                    'debtors_total_minor' => $debtorsTotal,
                    'creditors_total_minor' => 0,
                    'net_minor' => $debtorsTotal,
                ],
            ],
        ];
    }
}
