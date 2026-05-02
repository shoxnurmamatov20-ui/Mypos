<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/v1/admin/apps/{id} — partial update.
 *
 * Notes:
 *   - `platform` is intentionally NOT updatable. Changing platform on an
 *     existing row would orphan TenantAppBuild history; create a fresh
 *     row instead.
 *   - `bundle_id` is also frozen post-creation. Bundle IDs map 1:1 to
 *     App Store / Play Store listings — a change effectively requires a
 *     new app, not an update.
 *   - All other fields are optional ("sometimes") so the client can PATCH
 *     a single field without re-sending the whole payload.
 */
class UpdateAppRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'app_name' => ['sometimes', 'string', 'min:2', 'max:64'],
            'short_name' => ['sometimes', 'nullable', 'string', 'max:32'],
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
            'screenshots' => ['sometimes', 'nullable', 'array'],
            'apple_team_id' => ['sometimes', 'nullable', 'string', 'max:16'],
            'apple_sku' => ['sometimes', 'nullable', 'string', 'max:64'],
            'google_package_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'build_account' => ['sometimes', 'string', Rule::in(['mypos', 'tenant'])],
        ];
    }
}
