<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Staff\Courier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Body validation for POST /api/v1/staff/courier/orders/{order}/deliver.
 */
class DeliverOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'received_amount' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'card', 'click', 'payme'])],
        ];
    }
}
