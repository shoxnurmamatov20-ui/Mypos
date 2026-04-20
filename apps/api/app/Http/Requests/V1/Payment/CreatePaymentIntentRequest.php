<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Payment;

use App\Domain\Payment\Enums\PaymentProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePaymentIntentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'provider' => ['required', Rule::in(PaymentProvider::values())],
            'options' => ['nullable', 'array'],
        ];
    }
}
