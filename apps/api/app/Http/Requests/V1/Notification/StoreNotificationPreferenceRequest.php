<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Notification;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'channel' => ['required', Rule::in(NotificationChannel::values())],
            'template' => ['nullable', Rule::in(NotificationTemplate::values())],
            'enabled' => ['required', 'boolean'],
        ];
    }
}
