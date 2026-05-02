<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/v1/admin/ai/menu/generate
 *
 * Validates the body for the AI menu generator and gates the call against
 * the tenant's tier (Pro+ only). Free tenants get a friendly 422 here
 * rather than a generic 403 from the policy.
 */
class GenerateMenuAiRequest extends FormRequest
{
    /** @var array<int, string> */
    private const SUPPORTED_LOCALES = ['uz', 'ru', 'en', 'kz', 'ky', 'tg'];

    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'cuisine_type' => ['required', 'string', 'min:2', 'max:64'],
            'item_count' => ['sometimes', 'integer', 'min:5', 'max:40'],
            'locales' => ['sometimes', 'array', 'max:6'],
            'locales.*' => ['string', 'in:' . implode(',', self::SUPPORTED_LOCALES)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';
            if (! TierFeatures::has($tier, 'ai_features')) {
                $v->errors()->add(
                    'cuisine_type',
                    __('AI funktsiyalari faqat Pro tarifdan boshlab mavjud'),
                );
            }
        });
    }
}
