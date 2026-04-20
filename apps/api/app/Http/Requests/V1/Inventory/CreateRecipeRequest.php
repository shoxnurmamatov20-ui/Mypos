<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class CreateRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'menu_item_id' => ['required', 'uuid', 'exists:menu_items,id'],
            'ingredient_id' => ['required', 'uuid', 'exists:ingredients,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit' => ['required', 'string', 'max:16'],
            'is_optional' => ['nullable', 'boolean'],
        ];
    }
}
