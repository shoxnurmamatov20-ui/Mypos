<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Table;

use App\Domain\Table\Enums\TableShape;
use App\Domain\Table\Enums\TableStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:1', 'max:64'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'category_id' => ['nullable', 'uuid', 'exists:table_categories,id'],
            'status' => ['nullable', Rule::in(TableStatus::values())],
            'shape' => ['nullable', Rule::in(TableShape::values())],
            'position_x' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'position_y' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'width' => ['nullable', 'integer', 'min:10', 'max:1000'],
            'height' => ['nullable', 'integer', 'min:10', 'max:1000'],
            'qr_code' => ['nullable', 'string', 'max:128'],
        ];
    }
}
