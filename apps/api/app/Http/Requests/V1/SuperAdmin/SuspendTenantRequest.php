<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SuspendTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_super_admin === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['required', Rule::in(['non_payment', 'abuse', 'other'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
