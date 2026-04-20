<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'nullable', 'uuid', 'exists:ingredient_categories,id'],
            'name' => ['sometimes', 'array'],
            'name.uz' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.ru' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.en' => ['sometimes', 'string', 'min:1', 'max:128'],
            'sku' => ['sometimes', 'nullable', 'string', 'max:64'],
            'unit' => ['sometimes', 'string', 'max:16'],
            'cost_per_unit' => ['sometimes', 'integer', 'min:0', 'max:1000000000'],
            'min_stock' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'reorder_point' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
