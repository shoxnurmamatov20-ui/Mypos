<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * PATCH /api/v1/admin/brand — partial brand update.
 *
 * Validation highlights:
 *   - colors must be 7-char hex (`#RRGGBB`) — alpha not stored.
 *   - font whitelist matches the curated Google Fonts list rendered by Next.js
 *     (so the dashboard preview and published pages cannot diverge).
 *   - i18n fields use the project-wide `{ uz, ru, en }` shape; missing locale
 *     keys default to empty string at the resource layer.
 *   - `custom_css` is gated server-side: even if a Plus tenant downgrades
 *     mid-session their next save fails with a 422 instead of silently
 *     persisting forbidden styles.
 */
class UpdateBrandRequest extends FormRequest
{
    /** Themes accepted by the migration (`theme` column, default 'modern'). */
    public const ALLOWED_THEMES = ['modern', 'classic', 'minimal', 'premium'];

    /** Curated body-font whitelist. Sync with apps/web-dashboard. */
    public const ALLOWED_FONT_FAMILIES = [
        'Inter',
        'Poppins',
        'Roboto',
        'Lato',
        'Merriweather',
        'Playfair Display',
    ];

    /** Heading fonts may use display-style entries on top of the body list. */
    public const ALLOWED_HEADING_FONTS = [
        'Inter',
        'Poppins',
        'Roboto',
        'Lato',
        'Merriweather',
        'Playfair Display',
        'Montserrat',
        'Oswald',
        'Raleway',
    ];

    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $hex = ['regex:/^#[0-9a-fA-F]{6}$/'];
        $i18n = ['array'];
        $i18nValue = ['nullable', 'string', 'max:512'];

        return [
            'theme' => ['sometimes', 'string', Rule::in(self::ALLOWED_THEMES)],

            // Image URLs are written by the upload endpoints, but a manual
            // setter (e.g. revert to default) is allowed here too.
            'logo_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'logo_dark_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'favicon_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'cover_image_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'hero_image_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'ogimage_url' => ['sometimes', 'nullable', 'url', 'max:512'],

            'primary_color' => array_merge(['sometimes', 'string'], $hex),
            'accent_color' => array_merge(['sometimes', 'string'], $hex),
            'text_color' => array_merge(['sometimes', 'string'], $hex),
            'background_color' => array_merge(['sometimes', 'string'], $hex),

            'font_family' => ['sometimes', 'string', Rule::in(self::ALLOWED_FONT_FAMILIES)],
            'font_heading' => ['sometimes', 'nullable', 'string', Rule::in(self::ALLOWED_HEADING_FONTS)],

            // i18n marketing copy — { uz, ru, en } shape.
            'hero_title' => ['sometimes', 'nullable', ...$i18n],
            'hero_title.uz' => $i18nValue,
            'hero_title.ru' => $i18nValue,
            'hero_title.en' => $i18nValue,

            'hero_subtitle' => ['sometimes', 'nullable', ...$i18n],
            'hero_subtitle.uz' => $i18nValue,
            'hero_subtitle.ru' => $i18nValue,
            'hero_subtitle.en' => $i18nValue,

            'tagline' => ['sometimes', 'nullable', ...$i18n],
            'tagline.uz' => array_merge($i18nValue, ['max:160']),
            'tagline.ru' => array_merge($i18nValue, ['max:160']),
            'tagline.en' => array_merge($i18nValue, ['max:160']),

            // Plus+ feature — additional gating + content filter in
            // withValidator() below. 50KB cap protects payload bloat;
            // sanitization rejects XSS attempts (script tags, JS URIs,
            // CSS expressions, embedded HTML).
            'custom_css' => ['sometimes', 'nullable', 'string', 'max:50000'],

            'instagram_handle' => ['sometimes', 'nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9._]+$/'],
            'facebook_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'telegram_handle' => ['sometimes', 'nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_]+$/'],
        ];
    }

    /**
     * Tier-aware checks that need access to the authenticated user's tenant.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->has('custom_css') || $this->input('custom_css') === null) {
                return;
            }

            $user = $this->user();
            $tenant = $user?->tenant;
            $tier = $tenant?->tier ?? 'free';

            // Content sanitization — even valid Plus+ tenants cannot inject
            // active content via the CSS field. Stored XSS prevention is more
            // important than DRY since the consumer renders this via
            // `<style dangerouslySetInnerHTML>`.
            $css = (string) $this->input('custom_css');
            $forbidden = [
                '/<\s*\/?\s*style\b/i',         // breaks out of <style>
                '/<\s*script\b/i',              // <script> injection
                '/javascript\s*:/i',            // javascript: URLs
                '/expression\s*\(/i',           // legacy IE css expression()
                '/behavior\s*:/i',              // legacy IE behavior:
                '/-moz-binding\s*:/i',          // legacy Firefox XBL
                '/<\s*\/?(?:iframe|object|embed|svg|math)\b/i',
                '/@import\b/i',                 // disallow remote @import
                '/url\s*\(\s*["\']?\s*data\s*:\s*text\/html/i', // data: HTML URL
            ];
            foreach ($forbidden as $pattern) {
                if (preg_match($pattern, $css) === 1) {
                    $v->errors()->add(
                        'custom_css',
                        __('custom_css contains disallowed content (script, JS URI, expression, @import, etc.).'),
                    );
                    return;
                }
            }

            if (! TierFeatures::has($tier, 'custom_css')) {
                $v->errors()->add(
                    'custom_css',
                    __("custom_css faqat Plus va undan yuqori tarif uchun mavjud."),
                );
            }
        });
    }

    /**
     * Surface validation errors as the standard `{ data, meta, errors }` envelope.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new ValidationException($validator);
    }
}
