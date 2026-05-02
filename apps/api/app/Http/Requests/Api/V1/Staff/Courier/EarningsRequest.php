<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Staff\Courier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query validation for GET /api/v1/staff/courier/earnings.
 */
class EarningsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'period' => ['nullable', 'string', Rule::in(['today', 'week', 'month'])],
        ];
    }

    public function period(): string
    {
        return (string) ($this->validated('period') ?? 'today');
    }
}
