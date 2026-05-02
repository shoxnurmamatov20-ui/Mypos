<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use App\Domain\SuperAdmin\Enums\SubscriptionPlan;
use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_super_admin === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:128'],
            'plan' => ['sometimes', Rule::in(SubscriptionPlan::values())],
            'subscription_plan' => ['sometimes', Rule::in(SubscriptionPlan::values())],
            'subscription_status' => ['sometimes', Rule::in(SubscriptionStatus::values())],
            'mrr_minor' => ['sometimes', 'integer', 'min:0'],
            'subscription_ends_at' => ['sometimes', 'nullable', 'date'],
            'trial_ends_at' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'email' => ['sometimes', 'nullable', 'email', 'max:128'],
            'default_locale' => ['sometimes', 'string', Rule::in(['uz', 'ru', 'en'])],
            'default_currency' => ['sometimes', 'string', 'size:3'],
        ];
    }
}
