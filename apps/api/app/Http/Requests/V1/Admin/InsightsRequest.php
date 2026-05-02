<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Phase-4 — POST /api/v1/admin/ai/insights body validation.
 *
 * Body:
 *   - `locale` (optional, default 'uz') — output language for the narrative.
 *
 * Tier gate: Enterprise only. Failing this returns 422 with a friendly
 * "upgrade your plan" message.
 */
class InsightsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user !== null && $user->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'locale' => ['sometimes', 'string', Rule::in(['uz', 'ru', 'en'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';

            if (! TierFeatures::has($tier, 'insights_narrative')) {
                $v->errors()->add(
                    'tier',
                    __('AI tahlil faqat Enterprise tarifda mavjud'),
                );
            }
        });
    }

    public function locale(): string
    {
        $locale = $this->validated()['locale'] ?? null;
        return is_string($locale) && $locale !== '' ? $locale : 'uz';
    }
}
