<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Warehouse;

use App\Domain\Warehouse\Enums\WasteReason;
use App\Domain\Warehouse\Enums\WasteStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */

class StoreWasteDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'warehouse_id' => [
                'required', 'uuid',
                Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId),
            ],
            'doc_date' => [
                'nullable',
                'date',
                'after_or_equal:'.now()->subMonths(3)->toDateString(),
                'before_or_equal:'.now()->addDay()->toDateString(),
            ],
            'reason' => ['required', Rule::in(WasteReason::values())],
            'status' => ['nullable', Rule::in(WasteStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],

            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.ingredient_id' => [
                'required', 'uuid',
                Rule::exists('ingredients', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'items.*.unit_cost' => ['nullable', 'integer', 'min:0', 'max:100000000000'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
