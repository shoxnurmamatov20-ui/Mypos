<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Warehouse;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAuditSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * The auditor walks the warehouse and reports the actual count for each
     * pre-snapshotted item. Items already in the session may be updated;
     * new ingredient_ids are ignored (snapshot is locked at session start).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['required', 'uuid', 'exists:audit_session_items,id'],
            'items.*.actual_quantity' => ['required', 'numeric', 'gte:0', 'max:1000000'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
