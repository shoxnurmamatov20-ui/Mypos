<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Kiosk;

use Illuminate\Foundation\Http\FormRequest;

class HeartbeatRequest extends FormRequest
{
    /** Auth handled by `kiosk.device` middleware. */
    public function authorize(): bool
    {
        return $this->attributes->get('kiosk_device') !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'app_version' => ['nullable', 'string', 'max:32'],
            'battery_percent' => ['nullable', 'integer', 'between:0,100'],
            'ip_address' => ['nullable', 'ip'],
            'device_info' => ['nullable', 'array'],
        ];
    }
}
