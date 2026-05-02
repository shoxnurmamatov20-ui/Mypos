<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact restaurant card payload for the marketplace listing screen.
 *
 * Reads soft fields (cuisine, rating, delivery_minutes, cover_url, …) from
 * `tenants.settings` JSON — the consumer marketplace MVP doesn't require
 * dedicated columns yet.  When usage matures we'll promote these to first-
 * class columns and let this resource keep the same external shape.
 *
 * Optional `distance_km` is set by the controller when the request includes
 * `?location=lat,lng` — we surface it via the `additional` payload bag.
 *
 * @mixin Tenant
 */
class PublicRestaurantResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $settings = is_array($this->settings) ? $this->settings : [];
        $marketplace = is_array($settings['marketplace'] ?? null) ? $settings['marketplace'] : [];

        $cuisine = is_string($marketplace['cuisine'] ?? null) ? $marketplace['cuisine'] : null;
        $cuisineLabel = is_array($marketplace['cuisine_label'] ?? null) ? $marketplace['cuisine_label'] : null;
        $coverUrl = is_string($marketplace['cover_url'] ?? null) ? $marketplace['cover_url'] : null;

        $rating = isset($marketplace['rating']) ? (float) $marketplace['rating'] : null;
        $reviewCount = isset($marketplace['review_count']) ? (int) $marketplace['review_count'] : null;
        $deliveryMinutes = isset($marketplace['delivery_minutes']) ? (int) $marketplace['delivery_minutes'] : null;
        $deliveryFee = isset($marketplace['delivery_fee_minor']) ? (int) $marketplace['delivery_fee_minor'] : null;
        $minOrderAmount = isset($marketplace['min_order_amount_minor']) ? (int) $marketplace['min_order_amount_minor'] : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'logo_url' => $this->logo_url,
            'cover_url' => $coverUrl,
            'cuisine' => $cuisine,
            'cuisine_label' => $cuisineLabel,
            'rating' => $rating,
            'review_count' => $reviewCount,
            'delivery_minutes' => $deliveryMinutes,
            'delivery_fee_minor' => $deliveryFee,
            'min_order_amount_minor' => $minOrderAmount,
            'currency' => $this->default_currency,
            'is_open' => $this->isActive() && $this->isOpenNow(),
            // The controller may attach `_distance_km` as a transient
            // attribute on the model when `?location=lat,lng` is in play.
            'distance_km' => $this->when(
                $this->resource->getAttribute('_distance_km') !== null,
                fn (): float => round((float) $this->resource->getAttribute('_distance_km'), 2),
            ),
        ];
    }

    /**
     * Crude open-now check using `tenants.settings.working_hours` if present.
     * Defaults to `true` when no schedule is configured — i.e. fail-open at
     * the marketplace level; we never want to silently hide a restaurant.
     */
    private function isOpenNow(): bool
    {
        $settings = is_array($this->settings) ? $this->settings : [];
        $hours = $settings['working_hours'] ?? null;
        if (! is_array($hours)) {
            return true;
        }

        $tz = $this->timezone ?: config('app.timezone', 'Asia/Tashkent');
        $now = now($tz);
        $key = strtolower($now->format('D')); // mon, tue, …

        $today = $hours[$key] ?? null;
        if (! is_array($today) || ! isset($today['open'], $today['close'])) {
            return true;
        }

        $minutes = (int) $now->format('H') * 60 + (int) $now->format('i');
        $open = $this->parseHm((string) $today['open']);
        $close = $this->parseHm((string) $today['close']);
        if ($open === null || $close === null) {
            return true;
        }

        return $close > $open
            ? $minutes >= $open && $minutes < $close
            : $minutes >= $open || $minutes < $close;
    }

    private function parseHm(string $hm): ?int
    {
        if (! preg_match('/^(\d{1,2}):(\d{2})$/', $hm, $m)) {
            return null;
        }
        return ((int) $m[1]) * 60 + (int) $m[2];
    }
}
