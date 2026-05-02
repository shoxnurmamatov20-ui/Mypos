<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/v1/admin/domains — register a custom hostname for the tenant.
 *
 * Validation:
 *   - Domain shape: RFC-1035-ish; lowercase, max 253 octets, no scheme/path.
 *   - Globally unique across the platform — two tenants cannot claim the
 *     same hostname (the DB has a unique index for defense-in-depth).
 *   - Tier gating: requires Plus+ — and the tenant has not exceeded the
 *     `max_domains` cap for their tier.
 *   - `verification_method` defaults to 'txt' — owner can opt into 'cname'.
 */
class CreateDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    protected function prepareForValidation(): void
    {
        $domain = $this->input('domain');
        if (is_string($domain)) {
            // Strip protocol + path so users can paste from a browser bar.
            $clean = strtolower(trim($domain));
            $clean = (string) preg_replace('#^https?://#i', '', $clean);
            $clean = explode('/', $clean, 2)[0] ?? $clean;
            $this->merge(['domain' => $clean]);
        }
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'domain' => [
                'required',
                'string',
                'min:4',
                'max:253',
                // Loose RFC-1035 hostname: labels of [a-z0-9-], dot-separated,
                // TLD ≥ 2 letters. Disallows leading/trailing hyphens per label.
                'regex:/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i',
                Rule::unique('tenant_domains', 'domain')->whereNull('deleted_at'),
            ],
            'verification_method' => ['sometimes', 'string', Rule::in(['txt', 'cname'])],
            'redirects_to' => ['sometimes', 'nullable', 'string', 'max:253'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'domain.regex' => __('Noto\'g\'ri domen formati'),
            'domain.unique' => __('Bu domen boshqa restoranga biriktirilgan'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';

            if (! TierFeatures::has($tier, 'custom_domain')) {
                $v->errors()->add(
                    'domain',
                    __('Custom domen Plus tarifdan yuqori uchun mavjud'),
                );
                return;
            }

            $maxDomains = TierFeatures::limit($tier, 'max_domains');
            if ($maxDomains > 0) {
                $existing = TenantDomain::query()
                    ->withoutGlobalScopes()
                    ->where('tenant_id', $tenant?->id)
                    ->whereNull('deleted_at')
                    ->count();

                if ($existing >= $maxDomains) {
                    $v->errors()->add(
                        'domain',
                        __('Tarif bo\'yicha :max ta domen chegarasi', ['max' => $maxDomains]),
                    );
                }
            }
        });
    }
}
