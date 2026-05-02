<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full restaurant detail page payload — branding, working hours, delivery
 * zones, contact info.  Returned by `GET /api/v1/public/restaurants/{slug}`.
 *
 * @mixin Tenant
 */
class PublicRestaurantDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $settings = is_array($this->settings) ? $this->settings : [];
        $marketplace = is_array($settings['marketplace'] ?? null) ? $settings['marketplace'] : [];
        $branding = is_array($settings['branding'] ?? null) ? $settings['branding'] : [];
        $workingHours = is_array($settings['working_hours'] ?? null) ? $settings['working_hours'] : null;
        $deliveryZones = is_array($settings['delivery_zones'] ?? null) ? $settings['delivery_zones'] : null;

        $description = $marketplace['description'] ?? null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => is_array($description) ? $description : ($description !== null ? (string) $description : null),

            'branding' => [
                'logo_url' => $this->logo_url,
                'cover_url' => is_string($marketplace['cover_url'] ?? null) ? $marketplace['cover_url'] : null,
                'primary_color' => is_string($branding['primary_color'] ?? null) ? $branding['primary_color'] : null,
                'accent_color' => is_string($branding['accent_color'] ?? null) ? $branding['accent_color'] : null,
            ],

            'cuisine' => is_string($marketplace['cuisine'] ?? null) ? $marketplace['cuisine'] : null,
            'cuisine_label' => is_array($marketplace['cuisine_label'] ?? null) ? $marketplace['cuisine_label'] : null,

            'rating' => isset($marketplace['rating']) ? (float) $marketplace['rating'] : null,
            'review_count' => isset($marketplace['review_count']) ? (int) $marketplace['review_count'] : null,

            'contact' => [
                'phone' => $this->phone,
                'email' => $this->email,
            ],

            'address' => is_array($marketplace['address'] ?? null) ? $marketplace['address'] : null,
            'location' => is_array($marketplace['location'] ?? null) ? $marketplace['location'] : null,

            'delivery' => [
                'minutes' => isset($marketplace['delivery_minutes']) ? (int) $marketplace['delivery_minutes'] : null,
                'fee_minor' => isset($marketplace['delivery_fee_minor']) ? (int) $marketplace['delivery_fee_minor'] : null,
                'min_order_minor' => isset($marketplace['min_order_amount_minor']) ? (int) $marketplace['min_order_amount_minor'] : null,
                'zones' => $deliveryZones,
            ],

            'working_hours' => $workingHours,

            'default_locale' => $this->default_locale,
            'default_currency' => $this->default_currency,
            'timezone' => $this->timezone,

            'is_open' => $this->isActive(),
        ];
    }
}
