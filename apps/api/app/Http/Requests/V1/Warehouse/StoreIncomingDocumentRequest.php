<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Warehouse;

use App\Domain\Warehouse\Enums\IncomingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */

class StoreIncomingDocumentRequest extends FormRequest
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
                'after_or_equal:'.now()->subYear()->toDateString(),
                'before_or_equal:'.now()->addDay()->toDateString(),
            ],
            'supplier_name' => ['nullable', 'string', 'max:255'],
            'supplier_inn' => ['nullable', 'string', 'max:32'],
            'currency' => ['nullable', Rule::in(['UZS', 'USD', 'EUR', 'RUB', 'KZT', 'TRY'])],
            'status' => ['nullable', Rule::in(IncomingStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],

            // Cap items array to prevent DoS (security C3) and bulk-insert overload.
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.ingredient_id' => [
                'required', 'uuid',
                Rule::exists('ingredients', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'items.*.unit_price' => ['nullable', 'integer', 'min:0', 'max:100000000000'],
            'items.*.expiry_date' => ['nullable', 'date'],
            'items.*.batch_number' => ['nullable', 'string', 'max:64'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
