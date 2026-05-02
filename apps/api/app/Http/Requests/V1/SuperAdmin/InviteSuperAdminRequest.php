<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use App\Domain\SuperAdmin\Enums\SuperAdminRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteSuperAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_super_admin === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'role' => ['nullable', Rule::in(SuperAdminRole::values())],
            'name' => ['nullable', 'string', 'max:128'],
        ];
    }
}
