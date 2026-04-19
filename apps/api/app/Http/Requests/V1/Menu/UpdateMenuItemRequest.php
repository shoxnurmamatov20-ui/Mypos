<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Menu;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'uuid', 'exists:menu_categories,id'],
            'name' => ['sometimes', 'array'],
            'name.uz' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.ru' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.en' => ['sometimes', 'string', 'min:1', 'max:128'],
            'description' => ['sometimes', 'nullable', 'array'],
            'description.uz' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'description.ru' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'description.en' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'slug' => ['sometimes', 'nullable', 'string', 'min:1', 'max:192', 'regex:/^[a-z0-9-]+$/'],
            'sku' => ['sometimes', 'nullable', 'string', 'max:64'],

            'price_amount' => ['sometimes', 'integer', 'min:0', 'max:1000000000'],
            'price_currency' => ['sometimes', 'string', 'in:UZS,USD,EUR,RUB,KZT'],
            'cost_amount' => ['sometimes', 'nullable', 'integer', 'min:0'],

            'image_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url', 'max:512'],

            'allergens' => ['sometimes', 'nullable', 'array'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'calories' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'preparation_minutes' => ['sometimes', 'nullable', 'integer', 'min:0'],

            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'has_discount' => ['sometimes', 'boolean'],
            'discount_percent' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],

            'stock_tracked' => ['sometimes', 'boolean'],
            'current_stock' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'nullable', 'integer', 'min:0'],

            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
