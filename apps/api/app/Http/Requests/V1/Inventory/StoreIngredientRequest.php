<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'uuid', 'exists:ingredient_categories,id'],
            'name' => ['required', 'array'],
            'name.uz' => ['required', 'string', 'min:1', 'max:128'],
            'name.ru' => ['required', 'string', 'min:1', 'max:128'],
            'name.en' => ['required', 'string', 'min:1', 'max:128'],
            'sku' => ['nullable', 'string', 'max:64'],
            'unit' => ['required', 'string', 'max:16'],
            'cost_per_unit' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'current_stock' => ['nullable', 'numeric', 'min:0'],
            'initial_stock' => ['nullable', 'numeric', 'min:0'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'reorder_point' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
