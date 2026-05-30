<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\CEO;

use App\Domain\Clinic\Actions\BulkComplaintAction;
use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Foundation\Http\FormRequest;

class BulkComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:' . implode(',', BulkComplaintAction::ACTIONS)],
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'min:1'],
            'status' => ['required_if:action,set_status', 'nullable', 'string', 'in:' . implode(',', ClinicComplaint::STATUSES)],
            'resolution_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
