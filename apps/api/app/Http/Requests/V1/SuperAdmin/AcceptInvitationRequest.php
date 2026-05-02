<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'min:32', 'max:96'],
            'name' => ['required', 'string', 'min:2', 'max:128'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }
}
