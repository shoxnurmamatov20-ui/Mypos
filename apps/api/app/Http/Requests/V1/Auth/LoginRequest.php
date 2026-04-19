<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, string|array<int, string>> */
    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'min:3', 'max:128'],
            'password' => ['required', 'string', 'min:1', 'max:128'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'identifier.required' => 'Email, telefon raqami yoki username kiriting',
            'password.required' => 'Parolni kiriting',
        ];
    }
}
