<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Staff\Courier;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Body validation for POST /api/v1/staff/courier/location.
 *
 * Kept intentionally minimal — this endpoint runs at high frequency
 * (every ~10 s per active courier). Heavy rules belong elsewhere.
 */
class RecordLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'accuracy_meters' => ['nullable', 'numeric', 'min:0'],
            'heading' => ['nullable', 'numeric', 'between:0,360'],
            'speed_mps' => ['nullable', 'numeric', 'min:0'],
            'battery_percent' => ['nullable', 'integer', 'between:0,100'],
            'order_id' => ['nullable', 'uuid', 'exists:orders,id'],
            'recorded_at' => ['nullable', 'date'],
        ];
    }
}
