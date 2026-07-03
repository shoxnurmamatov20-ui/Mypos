<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\CEO;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Batch-mint visit tokens from the CEO panel.
 *
 * Tenant isolation happens at the validation layer: `tenant_id` must appear
 * in the caller's `tenant_owners` rows, and any category/table must belong
 * to that same tenant — foreign ids fail with the same generic "invalid"
 * message a non-existent id gets, so nothing about other tenants leaks.
 *
 * @method \App\Models\User user($guard = null)
 */
class StoreVisitTokenBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tenant_id' => [
                'required', 'uuid',
                Rule::exists('tenant_owners', 'tenant_id')->where('user_id', $this->user()?->id),
            ],
            'table_category_id' => [
                'nullable', 'uuid',
                Rule::exists('table_categories', 'id')->where('tenant_id', $this->input('tenant_id')),
            ],
            'table_id' => [
                'nullable', 'uuid',
                Rule::exists('tables', 'id')->where('tenant_id', $this->input('tenant_id')),
            ],
            'visit_reference' => ['nullable', 'string', 'max:255'],
            // 720h = 30 days — long enough for banquet pre-prints, short
            // enough that forgotten batches age out on their own.
            'ttl_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
            'count' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
