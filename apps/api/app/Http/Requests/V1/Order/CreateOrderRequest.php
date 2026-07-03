<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Order;

use App\Domain\Order\Enums\OrderType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::in(OrderType::values())],
            'table_id' => ['nullable', 'uuid', 'exists:tables,id'],
            'customer_id' => ['nullable', 'uuid'],
            'guest_count' => ['nullable', 'integer', 'min:1', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
            // Flat ticket discount in minor units; the action clamps it to
            // the server-computed subtotal so a client can never drive the
            // total negative.
            'discount_amount' => ['nullable', 'integer', 'min:0'],

            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.menu_item_id' => ['required', 'uuid', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'items.*.modifiers' => ['nullable', 'array'],
            'items.*.modifiers.*.id' => ['required', 'string'],
            'items.*.modifiers.*.name' => ['required', 'string', 'max:128'],
            'items.*.modifiers.*.price_delta' => ['required', 'integer'],
        ];
    }
}
