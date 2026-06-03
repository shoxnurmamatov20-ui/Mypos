<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Unit;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUnitOfMeasureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:1', 'max:64'],
            'abbreviation' => ['sometimes', 'string', 'min:1', 'max:16'],
            'type' => ['sometimes', 'string', 'in:weight,volume,count,length'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
