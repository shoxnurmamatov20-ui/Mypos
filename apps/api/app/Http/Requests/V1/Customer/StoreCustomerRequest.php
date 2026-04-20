<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'string',
                'min:9',
                'max:32',
                // Loose UZ-friendly phone: optional +, digits only, min 9 chars
                'regex:/^\+?[0-9]{9,20}$/',
            ],
            'email' => ['nullable', 'email', 'max:128'],
            'first_name' => ['required', 'string', 'min:1', 'max:64'],
            'last_name' => ['nullable', 'string', 'max:64'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'locale' => ['nullable', 'string', 'in:uz,ru,en'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'avatar_url' => ['nullable', 'url', 'max:512'],

            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
