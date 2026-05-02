<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/v1/admin/ai/description
 *
 * Generates an appetising description for a menu item. `name` accepts a
 * string (single-locale name) OR a per-locale map — Claude handles both.
 */
class GenerateDescriptionAiRequest extends FormRequest
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
            'name' => ['required'],
            'ingredients' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'locales' => ['sometimes', 'array', 'max:6'],
            'locales.*' => ['string', 'in:' . implode(',', self::SUPPORTED_LOCALES)],
            'tone' => ['sometimes', 'string', 'in:appetizing,premium,casual'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';
            if (! TierFeatures::has($tier, 'ai_features')) {
                $v->errors()->add(
                    'name',
                    __('AI funktsiyalari faqat Pro tarifdan boshlab mavjud'),
                );
                return;
            }

            $name = $this->input('name');
            if (is_string($name)) {
                if (trim($name) === '' || strlen($name) > 200) {
                    $v->errors()->add('name', __('Nomi 1-200 belgi oralig\'ida bo\'lishi kerak'));
                }
                return;
            }
            if (! is_array($name) || $name === []) {
                $v->errors()->add('name', __('Nomi string yoki tilga moslashtirilgan ob\'ekt bo\'lishi kerak'));
                return;
            }
            foreach ($name as $locale => $value) {
                if (! is_string($locale)) {
                    $v->errors()->add('name', __('Har bir til kaliti string bo\'lishi kerak'));
                    return;
                }
                if (! is_string($value) || trim($value) === '' || strlen($value) > 200) {
                    $v->errors()->add(
                        "name.{$locale}",
                        __('Har bir nom 1-200 belgi oralig\'ida bo\'lishi kerak'),
                    );
                    return;
                }
            }
        });
    }
}
