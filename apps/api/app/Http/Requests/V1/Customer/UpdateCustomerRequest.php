<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
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
                'sometimes',
                'string',
                'min:9',
                'max:32',
                'regex:/^\+?[0-9]{9,20}$/',
            ],
            'email' => ['sometimes', 'nullable', 'email', 'max:128'],
            'first_name' => ['sometimes', 'string', 'min:1', 'max:64'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:64'],
            'birthday' => ['sometimes', 'nullable', 'date', 'before:today'],
            'locale' => ['sometimes', 'string', 'in:uz,ru,en'],
            'gender' => ['sometimes', 'nullable', 'string', 'in:male,female,other'],
            'avatar_url' => ['sometimes', 'nullable', 'url', 'max:512'],

            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:32'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
