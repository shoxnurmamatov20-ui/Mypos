<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^\+?\d{9,15}$/'],
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'phone.required' => __('Telefon raqami talab qilinadi'),
            'phone.regex' => __('Telefon raqami noto\'g\'ri formatda'),
            'pin.required' => __('PIN-kod talab qilinadi'),
            'pin.regex' => __('PIN-kod 4-6 raqamdan iborat bo\'lishi kerak'),
        ];
    }
}
