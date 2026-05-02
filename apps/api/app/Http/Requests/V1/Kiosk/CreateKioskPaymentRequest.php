<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Kiosk;

use App\Domain\Payment\Enums\PaymentProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateKioskPaymentRequest extends FormRequest
{
    /** Auth handled by `kiosk.device` middleware. */
    public function authorize(): bool
    {
        return $this->attributes->get('kiosk_device') !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        // Kiosks are limited to a curated subset of providers — no Uzum/Apelsin
        // unless the deployment explicitly supports those terminals.
        $allowed = [
            PaymentProvider::Card->value,
            PaymentProvider::Click->value,
            PaymentProvider::Payme->value,
            PaymentProvider::Cash->value,
        ];

        return [
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'provider' => ['required', Rule::in($allowed)],
        ];
    }
}
