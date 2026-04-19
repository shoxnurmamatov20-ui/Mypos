<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuCategoryRequest extends FormRequest
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
            'slug' => ['nullable', 'string', 'min:1', 'max:128', 'regex:/^[a-z0-9-]+$/'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['nullable', 'boolean'],
            'parent_id' => ['nullable', 'uuid', 'exists:menu_categories,id'],
        ];
    }
}
