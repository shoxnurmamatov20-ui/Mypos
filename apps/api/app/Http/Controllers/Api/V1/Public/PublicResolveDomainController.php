<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantBrand;
use App\Domain\Tenant\Models\TenantDomain;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Phase 2 — public host → tenant resolver.
 *
 * Called by web-consumer's Next.js middleware AND its server layout to
 * decide which tenant + brand a custom-domain request should render under.
 * Unauthenticated, IP-throttled, aggressively cached.
 *
 * Returns 404 with a generic body when:
 *   - the host is unknown / unverified
 *   - the parent tenant is suspended / inactive
 *
 * The 404 path is what tells the consumer middleware to render the
 * "not configured" fallback page.
 */
class PublicResolveDomainController extends Controller
{
    private const CACHE_TTL_SECONDS = 60;

    public function __invoke(Request $request): JsonResponse
    {
        $host = strtolower(trim((string) $request->query('host', '')));
        if ($host === '' || strlen($host) > 253) {
            return response()->json(['message' => 'Invalid host'], 400);
        }

        // Strip a port (`example.com:8080`) — Caddy strips before forwarding,
        // but local dev may include it.
        if (str_contains($host, ':') && ! str_starts_with($host, '[')) {
            $host = explode(':', $host)[0];
        }

        $payload = Cache::remember(
            'public:resolve-domain:' . $host,
            self::CACHE_TTL_SECONDS,
            fn () => $this->lookup($host),
        );

        if ($payload === null) {
            return response()->json([
                'message' => 'Domain not configured',
                'data' => null,
            ], 404);
        }

        return response()
            ->json(['data' => $payload])
            ->header('Cache-Control', 'public, max-age=30, s-maxage=60');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function lookup(string $host): ?array
    {
        $domain = TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('domain', $host)
            ->where('is_verified', true)
            ->whereNull('deleted_at')
            ->first(['tenant_id']);

        if ($domain === null) {
            return null;
        }

        $tenant = Tenant::query()
            ->withoutGlobalScopes()
            ->whereKey($domain->tenant_id)
            ->first();

        if ($tenant === null
            || $tenant->status !== 'active'
            || $tenant->suspended_at !== null) {
            return null;
        }

        $brand = TenantBrand::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->first();

        return [
            'slug' => $tenant->slug,
            'name' => $tenant->name,
            // No `short_name` column today — fall back to slug.
            'short_name' => $tenant->slug,
            'brand' => $this->serializeBrand($brand),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBrand(?TenantBrand $brand): array
    {
        if ($brand === null) {
            return [
                'theme' => 'modern',
                'logo_url' => null,
                'logo_dark_url' => null,
                'favicon_url' => null,
                'cover_image_url' => null,
                'hero_image_url' => null,
                'og_image_url' => null,
                'primary_color' => '#EA7C69',
                'accent_color' => '#9333EA',
                'text_color' => '#0F172A',
                'background_color' => '#FFFFFF',
                'font_family' => 'Inter',
                'font_heading' => null,
                'hero_title' => ['uz' => '', 'ru' => '', 'en' => ''],
                'hero_subtitle' => ['uz' => '', 'ru' => '', 'en' => ''],
                'tagline' => ['uz' => '', 'ru' => '', 'en' => ''],
                'custom_css' => null,
                'instagram_handle' => null,
                'facebook_url' => null,
                'telegram_handle' => null,
            ];
        }

        return [
            'theme' => $brand->theme,
            'logo_url' => $brand->logo_url,
            'logo_dark_url' => $brand->logo_dark_url,
            'favicon_url' => $brand->favicon_url,
            'cover_image_url' => $brand->cover_image_url,
            'hero_image_url' => $brand->hero_image_url,
            'og_image_url' => $brand->ogimage_url,
            'primary_color' => $brand->primary_color,
            'accent_color' => $brand->accent_color,
            'text_color' => $brand->text_color,
            'background_color' => $brand->background_color,
            'font_family' => $brand->font_family,
            'font_heading' => $brand->font_heading,
            'hero_title' => $this->i18n($brand->hero_title),
            'hero_subtitle' => $this->i18n($brand->hero_subtitle),
            'tagline' => $this->i18n($brand->tagline),
            'custom_css' => $brand->custom_css,
            'instagram_handle' => $brand->instagram_handle,
            'facebook_url' => $brand->facebook_url,
            'telegram_handle' => $brand->telegram_handle,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $value
     * @return array{uz: string, ru: string, en: string}
     */
    private function i18n(?array $value): array
    {
        $value ??= [];

        return [
            'uz' => isset($value['uz']) && is_string($value['uz']) ? $value['uz'] : '',
            'ru' => isset($value['ru']) && is_string($value['ru']) ? $value['ru'] : '',
            'en' => isset($value['en']) && is_string($value['en']) ? $value['en'] : '',
        ];
    }
}
