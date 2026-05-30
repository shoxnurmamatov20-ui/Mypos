<?php

declare(strict_types=1);

namespace App\Domain\Reports\Services;

use App\Domain\Payment\Models\Payment;
use App\Domain\Reports\Services\Concerns\NormalizesDateRange;
use Illuminate\Support\Facades\DB;

/**
 * Cashflow report. Aggregates captured payments by day / week / month
 * over the date range. Outflow rows are reserved (currently always 0)
 * for the future Expense module — that way the chart shape on the
 * dashboard doesn't change once expenses ship.
 */
final class CashflowReportService
{
    use NormalizesDateRange;

    /** @return array{data: array<string, mixed>} */
    public function generate(?string $from, ?string $to, string $groupBy = 'day'): array
    {
        [$fromCarbon, $toCarbon] = $this->normalizeRange($from, $to);
        $driver = DB::connection()->getDriverName();
        $periodExpr = $this->periodExpression('payments.created_at', $groupBy, $driver);

        $rows = Payment::query()
            ->from('payments')
            ->whereBetween('payments.created_at', [$fromCarbon, $toCarbon])
            ->where('payments.status', 'captured')
            ->selectRaw(
                "{$periodExpr} AS period,
                 COALESCE(SUM(amount), 0) AS inflow,
                 COUNT(*) AS cnt"
            )
            ->groupBy(DB::raw($periodExpr))
            ->orderBy(DB::raw($periodExpr))
            ->get();

        $series = $rows->map(function ($row): array {
            $inflow = (int) $row->inflow;
            return [
                'period' => (string) $row->period,
                'inflow_minor' => $inflow,
                'outflow_minor' => 0,
                'net_minor' => $inflow,
                'transactions' => (int) $row->cnt,
            ];
        })->values()->all();

        $byProvider = $this->byProvider($fromCarbon, $toCarbon);
        $totalInflow = (int) array_sum(array_column($series, 'inflow_minor'));
        $totalTransactions = (int) array_sum(array_column($series, 'transactions'));

        return [
            'data' => [
                'series' => $series,
                'by_provider' => $byProvider,
                'summary' => [
                    'total_inflow_minor' => $totalInflow,
                    'total_outflow_minor' => 0,
                    'net_minor' => $totalInflow,
                    'transaction_count' => $totalTransactions,
                    'avg_transaction_minor' => $totalTransactions > 0
                        ? (int) round($totalInflow / $totalTransactions)
                        : 0,
                ],
            ],
        ];
    }

    /** @return list<array{provider: string, amount_minor: int, count: int, percent: float}> */
    private function byProvider(\Illuminate\Support\Carbon $from, \Illuminate\Support\Carbon $to): array
    {
        $rows = Payment::query()
            ->whereBetween('payments.created_at', [$from, $to])
            ->where('status', 'captured')
            ->selectRaw('provider, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS cnt')
            ->groupBy('provider')
            ->orderByDesc('amount')
            ->get();

        $total = (int) $rows->sum('amount');

        return $rows->map(function ($row) use ($total): array {
            $amount = (int) $row->amount;
            return [
                'provider' => (string) $row->provider,
                'amount_minor' => $amount,
                'count' => (int) $row->cnt,
                'percent' => $total > 0 ? round(($amount / $total) * 100, 2) : 0.0,
            ];
        })->all();
    }
}
