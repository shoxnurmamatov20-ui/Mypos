<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Menu;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'array'],
            'name.uz' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.ru' => ['sometimes', 'string', 'min:1', 'max:128'],
            'name.en' => ['sometimes', 'string', 'min:1', 'max:128'],
            'slug' => ['sometimes', 'nullable', 'string', 'min:1', 'max:128', 'regex:/^[a-z0-9-]+$/'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:64'],
            'color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            'parent_id' => ['sometimes', 'nullable', 'uuid', 'exists:menu_categories,id'],
        ];
    }
}
