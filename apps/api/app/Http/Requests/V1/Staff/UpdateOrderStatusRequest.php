<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Staff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([
                'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled',
            ])],
            'reason' => ['nullable', 'string', 'max:500', 'required_if:status,cancelled'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reason.required_if' => __('Bekor qilish uchun sabab kiriting'),
        ];
    }
}
