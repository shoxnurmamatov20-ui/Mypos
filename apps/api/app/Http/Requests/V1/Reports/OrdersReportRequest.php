<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Reports;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Reports\Policies\ReportPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */

class OrdersReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user === null) {
            return false;
        }
        return (new ReportPolicy())->viewAny($user);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;
        $maxFuture = now()->addDay()->toDateString();
        $minPast = now()->subYears(2)->toDateString();

        $sortValues = [
            'placed_at', '-placed_at',
            'created_at', '-created_at',
            'total_amount', '-total_amount',
            'order_no', '-order_no',
            'status', '-status',
            'type', '-type',
            'paid_at', '-paid_at',
        ];

        return [
            'from' => ['nullable', 'date', 'after_or_equal:'.$minPast, 'before_or_equal:'.$maxFuture],
            'to' => ['nullable', 'date', 'after_or_equal:from', 'before_or_equal:'.$maxFuture],
            'status' => ['nullable', Rule::in(OrderStatus::values())],
            'type' => ['nullable', Rule::in(OrderType::values())],
            'table_id' => [
                'nullable', 'uuid',
                Rule::exists('tables', 'id')->where('tenant_id', $tenantId),
            ],
            'employee_id' => [
                'nullable', 'uuid',
                Rule::exists('employees', 'id')->where('tenant_id', $tenantId),
            ],
            'payment_method' => ['nullable', Rule::in(PaymentProvider::values())],
            'q' => ['nullable', 'string', 'max:64'],
            'sort' => ['nullable', Rule::in($sortValues)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ];
    }
}
