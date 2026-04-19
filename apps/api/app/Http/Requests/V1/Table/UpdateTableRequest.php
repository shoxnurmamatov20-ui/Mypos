<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Table;

use App\Domain\Table\Enums\TableShape;
use App\Domain\Table\Enums\TableStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTableRequest extends FormRequest
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
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'category_id' => ['sometimes', 'nullable', 'uuid', 'exists:table_categories,id'],
            'status' => ['sometimes', Rule::in(TableStatus::values())],
            'shape' => ['sometimes', Rule::in(TableShape::values())],
            'position_x' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:5000'],
            'position_y' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:5000'],
            'width' => ['sometimes', 'nullable', 'integer', 'min:10', 'max:1000'],
            'height' => ['sometimes', 'nullable', 'integer', 'min:10', 'max:1000'],
            'qr_code' => ['sometimes', 'nullable', 'string', 'max:128'],
        ];
    }
}
