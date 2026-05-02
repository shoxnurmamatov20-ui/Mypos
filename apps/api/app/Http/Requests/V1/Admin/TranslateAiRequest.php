<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/v1/admin/ai/translate
 *
 * `source` accepts either:
 *   - a single string (single-translation mode), or
 *   - a string-keyed map of strings (batch mode).
 *
 * Hard caps:
 *   - 50 keys per batch (controls per-call cost)
 *   - 4000 chars per value (covers any reasonable menu description)
 */
class TranslateAiRequest extends FormRequest
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
            // The `source` value is polymorphic — we shape-check it in
            // withValidator() rather than pretending it's both a string AND
            // an array at this layer.
            'source' => ['required'],
            'source_locale' => ['required', 'string', 'in:' . implode(',', self::SUPPORTED_LOCALES)],
            'target_locales' => ['required', 'array', 'min:1', 'max:6'],
            'target_locales.*' => ['string', 'in:' . implode(',', self::SUPPORTED_LOCALES)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            // Tier gate.
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';
            if (! TierFeatures::has($tier, 'ai_features')) {
                $v->errors()->add(
                    'source',
                    __('AI funktsiyalari faqat Pro tarifdan boshlab mavjud'),
                );
                return;
            }

            // Polymorphic source check — must be string OR string→string map.
            $source = $this->input('source');
            if (is_string($source)) {
                if (trim($source) === '' || strlen($source) > 4000) {
                    $v->errors()->add('source', __('Manba matni 1-4000 belgi oralig\'ida bo\'lishi kerak'));
                }
                return;
            }
            if (! is_array($source)) {
                $v->errors()->add('source', __('Manba matn yoki kalit-qiymat ob\'ekt bo\'lishi kerak'));
                return;
            }
            if (count($source) === 0 || count($source) > 50) {
                $v->errors()->add('source', __('Manba 1-50 ta yozuvdan iborat bo\'lishi kerak'));
                return;
            }
            foreach ($source as $key => $value) {
                if (! is_string($key) || $key === '') {
                    $v->errors()->add('source', __('Har bir kalit string bo\'lishi kerak'));
                    return;
                }
                if (! is_string($value) || trim($value) === '' || strlen($value) > 4000) {
                    $v->errors()->add(
                        "source.{$key}",
                        __('Har bir qiymat 1-4000 belgi oralig\'ida bo\'lishi kerak'),
                    );
                    return;
                }
            }
        });
    }
}
