<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class SuperAdminLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:1', 'max:255'],
        ];
    }
}
