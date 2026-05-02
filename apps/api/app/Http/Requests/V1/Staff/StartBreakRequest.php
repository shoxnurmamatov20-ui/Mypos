<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Staff;

use App\Domain\Employee\Enums\BreakReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartBreakRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', Rule::in(BreakReason::values())],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
