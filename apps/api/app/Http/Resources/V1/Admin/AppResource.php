<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\Tenant\Models\TenantApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TenantApp
 */
class AppResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'platform' => $this->castedValue('platform'),
            'app_name' => $this->app_name,
            'short_name' => $this->short_name,
            'bundle_id' => $this->bundle_id,

            // i18n marketing copy in canonical {uz, ru, en} shape.
            'description' => $this->normalizeI18n($this->description),
            'keywords' => is_array($this->keywords) ? array_values($this->keywords) : [],

            'icon_url' => $this->icon_url,
            'splash_url' => $this->splash_url,
            'adaptive_icon_url' => $this->adaptive_icon_url,
            'adaptive_icon_bg' => $this->adaptive_icon_bg,
            'feature_graphic_url' => $this->feature_graphic_url,
            'screenshots' => is_array($this->screenshots) ? $this->screenshots : [],

            'apple_team_id' => $this->apple_team_id,
            'apple_app_id' => $this->apple_app_id,
            'apple_sku' => $this->apple_sku,
            'google_package_name' => $this->google_package_name,
            'google_app_id' => $this->google_app_id,

            'build_account' => $this->build_account,
            'status' => $this->castedValue('status'),

            'current_version' => $this->current_version,
            'current_build_number' => $this->current_build_number,
            'latest_build_id' => $this->latest_build_id,
            'latest_build' => AppBuildResource::make($this->whenLoaded('latestBuild')),

            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Coerce a JSONB i18n column into the canonical 3-locale shape so the
     * dashboard never has to defend against missing keys.
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

    /**
     * Read an enum-cast attribute as its scalar value. Eloquent returns the
     * enum object when the column is cast, but the JSON contract expects a
     * plain string.
     */
    private function castedValue(string $key): ?string
    {
        $value = $this->resource?->getAttribute($key);
        if ($value === null) {
            return null;
        }
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }
        return (string) $value;
    }
}
