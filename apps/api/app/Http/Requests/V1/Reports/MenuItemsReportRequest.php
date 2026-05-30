<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Reports;

use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */
class MenuItemsReportRequest extends DateRangeReportRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return array_merge(parent::rules(), [
            'category_id' => [
                'nullable', 'uuid',
                Rule::exists('menu_categories', 'id')->where('tenant_id', $tenantId),
            ],
            'sort' => [
                'nullable',
                Rule::in([
                    'quantity', '-quantity',
                    'revenue', '-revenue',
                    'orders_count', '-orders_count',
                ]),
            ],
        ]);
    }
}
