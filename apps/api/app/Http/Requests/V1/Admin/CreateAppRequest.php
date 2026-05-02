<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/v1/admin/apps — register a new native-app config row.
 *
 * Validation:
 *   - `platform` must be ios|android|universal.
 *   - `app_name` 2–64 chars (Apple's hard ceiling on App Store name).
 *   - `bundle_id` reverse-DNS, lowercase, 3 dot-separated labels minimum,
 *     globally unique among non-deleted rows (matches the partial unique
 *     index `tenant_apps_bundle_uq` from the migration).
 *   - At most one row per (tenant, platform) — enforced both here and at
 *     the DB level.
 *   - Tier gate: requires `canUseNativeApp()` (Enterprise+). Failing this
 *     produces a 422 with a friendlier message than the policy 403.
 */
class CreateAppRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    protected function prepareForValidation(): void
    {
        $bundleId = $this->input('bundle_id');
        if (is_string($bundleId)) {
            $this->merge(['bundle_id' => strtolower(trim($bundleId))]);
        }
        $platform = $this->input('platform');
        if (is_string($platform)) {
            $this->merge(['platform' => strtolower(trim($platform))]);
        }
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'platform' => ['required', 'string', Rule::in(AppPlatform::values())],
            'app_name' => ['required', 'string', 'min:2', 'max:64'],
            'short_name' => ['sometimes', 'nullable', 'string', 'max:32'],
            'bundle_id' => [
                'required',
                'string',
                'min:3',
                'max:255',
                // Reverse-DNS: at least two dot-separated lowercase labels.
                // Apple/Google both accept letters, digits, and hyphens; we
                // additionally require dots to enforce a sensible minimum.
                'regex:/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/',
                Rule::unique('tenant_apps', 'bundle_id')->whereNull('deleted_at'),
            ],
            'description' => ['sometimes', 'nullable', 'array'],
            'description.uz' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'description.ru' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'description.en' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'keywords' => ['sometimes', 'nullable', 'array'],
            'keywords.*' => ['string', 'max:64'],
            'icon_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'splash_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'adaptive_icon_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'adaptive_icon_bg' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'feature_graphic_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'apple_team_id' => ['sometimes', 'nullable', 'string', 'max:16'],
            'apple_sku' => ['sometimes', 'nullable', 'string', 'max:64'],
            'google_package_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'build_account' => ['sometimes', 'string', Rule::in(['mypos', 'tenant'])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'bundle_id.regex' => __('Bundle ID reverse-DNS shaklida bo\'lishi kerak (masalan: uz.mypos.myrestaurant)'),
            'bundle_id.unique' => __('Bu Bundle ID boshqa restoran tomonidan band qilingan'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';

            if (! TierFeatures::has($tier, 'native_app')) {
                $v->errors()->add(
                    'platform',
                    __('Native app faqat Enterprise tarifda mavjud'),
                );
                return;
            }

            // One row per (tenant, platform) — DB has a partial unique index
            // for defense-in-depth, but a clean 422 here is friendlier than
            // a SQL constraint violation.
            $platform = $this->input('platform');
            if (is_string($platform) && $tenant !== null) {
                $exists = TenantApp::query()
                    ->withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->where('platform', $platform)
                    ->whereNull('deleted_at')
                    ->exists();
                if ($exists) {
                    $v->errors()->add(
                        'platform',
                        __(':platform uchun ilova allaqachon mavjud', ['platform' => $platform]),
                    );
                }
            }
        });
    }
}
