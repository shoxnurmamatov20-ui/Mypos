<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Staff;

use Illuminate\Foundation\Http\FormRequest;

class ClockInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'shift_id' => ['nullable', 'uuid', 'exists:shifts,id'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
