<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Staff\Courier;

use App\Domain\Employee\Enums\DeliveryCancelReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Body validation for POST /api/v1/staff/courier/orders/{order}/cancel.
 */
class CancelDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', Rule::in(DeliveryCancelReason::values())],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
