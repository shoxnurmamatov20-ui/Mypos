<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Kiosk;

use Illuminate\Foundation\Http\FormRequest;

class PairKioskRequest extends FormRequest
{
    /** Public endpoint — no authenticated user. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'device_name' => ['required', 'string', 'max:64'],
            'device_info' => ['nullable', 'array'],
            'device_info.os' => ['nullable', 'string', 'max:64'],
            'device_info.app_version' => ['nullable', 'string', 'max:32'],
            'device_info.screen' => ['nullable', 'string', 'max:32'],
        ];
    }
}
