<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use App\Domain\SuperAdmin\Enums\SubscriptionPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_super_admin === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:128'],
            'slug' => ['required', 'string', 'min:3', 'max:64', 'regex:/^[a-z0-9\-]+$/'],
            'owner_name' => ['required', 'string', 'min:2', 'max:128'],
            'owner_email' => ['required', 'email', 'max:255'],
            'owner_phone' => ['nullable', 'string', 'max:32'],
            'owner_password' => ['required', 'string', 'min:8', 'max:128'],
            'plan' => ['nullable', Rule::in(SubscriptionPlan::values())],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'default_locale' => ['nullable', 'string', Rule::in(['uz', 'ru', 'en'])],
            'default_currency' => ['nullable', 'string', 'size:3'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
