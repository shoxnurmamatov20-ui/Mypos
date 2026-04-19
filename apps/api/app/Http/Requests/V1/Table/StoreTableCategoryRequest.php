<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Table;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'array'],
            'name.uz' => ['required', 'string', 'min:1', 'max:128'],
            'name.ru' => ['required', 'string', 'min:1', 'max:128'],
            'name.en' => ['required', 'string', 'min:1', 'max:128'],
            'slug' => ['nullable', 'string', 'max:128', 'regex:/^[a-z0-9-]+$/'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
