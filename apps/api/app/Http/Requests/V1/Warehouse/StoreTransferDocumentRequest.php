<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Warehouse;

use App\Domain\Warehouse\Enums\TransferStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */

class StoreTransferDocumentRequest extends FormRequest
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
            'from_warehouse_id' => [
                'required', 'uuid',
                Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId),
            ],
            'to_warehouse_id' => [
                'required', 'uuid', 'different:from_warehouse_id',
                Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId),
            ],
            'doc_date' => [
                'nullable',
                'date',
                'after_or_equal:'.now()->subMonths(3)->toDateString(),
                'before_or_equal:'.now()->addDay()->toDateString(),
            ],
            'status' => ['nullable', Rule::in(TransferStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],

            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.ingredient_id' => [
                'required', 'uuid',
                Rule::exists('ingredients', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
