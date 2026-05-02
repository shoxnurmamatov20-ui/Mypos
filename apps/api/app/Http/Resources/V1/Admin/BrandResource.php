<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\Tenant\Models\TenantBrand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TenantBrand
 */
class BrandResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'tenant_id' => $this->tenant_id,
            'theme' => $this->theme,

            // Image URLs (nullable — null until owner uploads).
            'logo_url' => $this->logo_url,
            'logo_dark_url' => $this->logo_dark_url,
            'favicon_url' => $this->favicon_url,
            'cover_image_url' => $this->cover_image_url,
            'hero_image_url' => $this->hero_image_url,
            // Frontend uses `og_image_url`; alias for backwards compat.
            'og_image_url' => $this->ogimage_url,
            'ogimage_url' => $this->ogimage_url,

            // Colors — always present, defaults from migration.
            'primary_color' => $this->primary_color,
            'accent_color' => $this->accent_color,
            'text_color' => $this->text_color,
            'background_color' => $this->background_color,

            // Typography.
            'font_family' => $this->font_family,
            'font_heading' => $this->font_heading,

            // i18n marketing copy — always emit the canonical { uz, ru, en }
            // shape so clients don't need to handle missing keys.
            'hero_title' => $this->normalizeI18n($this->hero_title),
            'hero_subtitle' => $this->normalizeI18n($this->hero_subtitle),
            'tagline' => $this->normalizeI18n($this->tagline),

            'custom_css' => $this->custom_css,

            'instagram_handle' => $this->instagram_handle,
            'facebook_url' => $this->facebook_url,
            'telegram_handle' => $this->telegram_handle,

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Coerce a JSONB i18n column into the canonical 3-locale shape.
     *
     * @param  array<string, mixed>|null  $value
     * @return array{uz: string, ru: string, en: string}
     */
    private function normalizeI18n(?array $value): array
    {
        $source = is_array($value) ? $value : [];

        return [
            'uz' => isset($source['uz']) && is_string($source['uz']) ? $source['uz'] : '',
            'ru' => isset($source['ru']) && is_string($source['ru']) ? $source['ru'] : '',
            'en' => isset($source['en']) && is_string($source['en']) ? $source['en'] : '',
        ];
    }
}
