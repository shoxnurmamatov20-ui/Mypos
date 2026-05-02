<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use App\Domain\Tenant\Services\TierFeatures;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Phase-4 — validates GET /api/v1/admin/ai/forecast/* query string.
 *
 * Two query parameters are common across the forecast endpoints:
 *
 *   - `days`     — trailing window length. Bounded 1..365.
 *   - `feature`  — implicitly set by the route (top-items|predict-week|
 *     low-sellers). The `withValidator` callback enforces the tier gate
 *     against `forecast_basic` / `forecast_predictive` so a Pro tenant
 *     can hit top-items but not predict-week.
 *
 * Failure mode: 422 with a translated message. The dashboard interprets
 * the validation error and shows an "upgrade your plan" CTA.
 */
class ForecastQueryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user !== null && $user->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $tenant = $this->user()?->tenant;
            $tier = $tenant?->tier ?? 'free';

            $required = $this->requiredFeature();

            if ($required !== null && ! TierFeatures::has($tier, $required)) {
                $v->errors()->add(
                    'tier',
                    __('Bu funksiya yuqori tarifni talab qiladi'),
                );
            }
        });
    }

    /**
     * Map the route name to the feature flag the tier must satisfy.
     */
    private function requiredFeature(): ?string
    {
        $name = $this->route()?->getName() ?? '';
        return match (true) {
            str_ends_with($name, 'predict_week') => 'forecast_predictive',
            str_ends_with($name, 'top_items'),
            str_ends_with($name, 'low_sellers') => 'forecast_basic',
            default => null,
        };
    }

    public function trailingDays(int $default): int
    {
        return (int) ($this->validated()['days'] ?? $default);
    }
}
