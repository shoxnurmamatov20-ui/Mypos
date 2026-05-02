<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Public;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Phase 4 — validate `GET /api/v1/public/exchange-rates`.
 *
 * Required query params:
 *   - from: ISO 4217 (3 chars). Validated against the currencies table.
 *   - to:   ISO 4217 (3 chars). Validated against the currencies table.
 *
 * Optional:
 *   - date: YYYY-MM-DD. Defaults to today. Cannot be in the future
 *     (we don't predict).
 *
 * Public endpoint — `authorize()` returns true unconditionally. The
 * route-level throttle (60 req/min/IP) is the abuse defense.
 */
class GetExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        return [
            'from' => [
                'required',
                'string',
                'size:3',
                Rule::exists('currencies', 'code'),
            ],
            'to' => [
                'required',
                'string',
                'size:3',
                Rule::exists('currencies', 'code'),
                'different:from',
            ],
            'date' => [
                'sometimes',
                'date_format:Y-m-d',
                'before_or_equal:today',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalise to uppercase BEFORE validation so 'usd' passes the
        // `exists:currencies,code` rule (the column stores 'USD').
        $this->merge([
            'from' => strtoupper((string) $this->query('from', '')),
            'to' => strtoupper((string) $this->query('to', '')),
        ]);
    }
}
