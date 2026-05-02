<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Public;

use App\Domain\Payment\Enums\PaymentProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a guest checkout payload against the marketplace `POST
 * /api/v1/public/orders` endpoint.
 *
 * No auth — but we still:
 *   - reject unknown payment providers (only those enabled for marketplace)
 *   - cap items / modifiers to prevent runaway payloads
 *   - require either delivery details OR `is_pickup=true`
 */
class CreatePublicOrderRequest extends FormRequest
{
    /** Public endpoint — auth is enforced via per-IP+phone throttling. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'restaurant_slug' => ['required', 'string', 'max:64'],

            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.menu_item_id' => ['required', 'uuid'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
            'items.*.modifiers' => ['nullable', 'array', 'max:20'],
            'items.*.modifiers.*.id' => ['required_with:items.*.modifiers', 'string', 'max:64'],
            'items.*.modifiers.*.name' => ['required_with:items.*.modifiers', 'string', 'max:128'],
            'items.*.modifiers.*.price_delta' => ['required_with:items.*.modifiers', 'integer'],

            'customer' => ['required', 'array'],
            'customer.phone' => ['required', 'string', 'min:7', 'max:32'],
            'customer.name' => ['nullable', 'string', 'max:128'],

            'delivery' => ['required', 'array'],
            'delivery.is_pickup' => ['nullable', 'boolean'],
            'delivery.address' => ['required_if:delivery.is_pickup,false', 'nullable', 'string', 'max:512'],
            'delivery.lat' => ['nullable', 'numeric', 'between:-90,90'],
            'delivery.lng' => ['nullable', 'numeric', 'between:-180,180'],
            'delivery.notes' => ['nullable', 'string', 'max:500'],

            'payment_method' => ['required', Rule::in([
                PaymentProvider::Cash->value,
                PaymentProvider::Click->value,
                PaymentProvider::Payme->value,
            ])],

            'order_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
