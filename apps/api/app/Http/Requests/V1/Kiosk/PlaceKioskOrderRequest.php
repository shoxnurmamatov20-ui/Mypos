<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Kiosk;

use Illuminate\Foundation\Http\FormRequest;

class PlaceKioskOrderRequest extends FormRequest
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
            'session_id' => ['nullable', 'uuid'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.menu_item_id' => ['required', 'uuid', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
            'items.*.modifiers' => ['nullable', 'array'],
            'items.*.modifiers.*.id' => ['required_with:items.*.modifiers', 'string', 'max:64'],
            'items.*.modifiers.*.name' => ['required_with:items.*.modifiers', 'string', 'max:64'],
            'items.*.modifiers.*.price_delta' => ['required_with:items.*.modifiers', 'integer'],
            'customer_phone_for_receipt' => ['nullable', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
