<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Warehouse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @method \App\Models\User user($guard = null)
 */
class StoreAuditSessionRequest extends FormRequest
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
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
