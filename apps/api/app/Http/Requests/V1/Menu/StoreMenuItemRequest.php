<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', 'exists:menu_categories,id'],
            'name' => ['required', 'array'],
            'name.uz' => ['required', 'string', 'min:1', 'max:128'],
            'name.ru' => ['required', 'string', 'min:1', 'max:128'],
            'name.en' => ['required', 'string', 'min:1', 'max:128'],
            'description' => ['nullable', 'array'],
            'description.uz' => ['nullable', 'string', 'max:2000'],
            'description.ru' => ['nullable', 'string', 'max:2000'],
            'description.en' => ['nullable', 'string', 'max:2000'],
            'slug' => ['nullable', 'string', 'min:1', 'max:192', 'regex:/^[a-z0-9-]+$/'],
            'sku' => ['nullable', 'string', 'max:64'],

            'price_amount' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'price_currency' => ['nullable', 'string', 'in:UZS,USD,EUR,RUB,KZT'],
            'cost_amount' => ['nullable', 'integer', 'min:0'],

            'image_url' => ['nullable', 'url', 'max:512'],
            'thumbnail_url' => ['nullable', 'url', 'max:512'],

            'allergens' => ['nullable', 'array'],
            'allergens.*' => ['string', 'max:64'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'preparation_minutes' => ['nullable', 'integer', 'min:0', 'max:999'],

            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'is_new' => ['nullable', 'boolean'],
            'has_discount' => ['nullable', 'boolean'],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],

            'stock_tracked' => ['nullable', 'boolean'],
            'current_stock' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],

            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
