<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Inventory;

use App\Domain\Inventory\Enums\StockMovementReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'delta' => ['required', 'numeric', 'not_in:0'],
            'reason' => ['required', 'string', Rule::in(StockMovementReason::values())],
            'cost_per_unit' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'reference_type' => ['nullable', 'string', 'max:64'],
            'reference_id' => ['nullable', 'uuid'],
        ];
    }
}
