<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\CEO;

use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Foundation\Http\FormRequest;

class UpdateComplaintRequest extends FormRequest
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
            'status' => ['sometimes', 'nullable', 'string', 'in:' . implode(',', ClinicComplaint::STATUSES)],
            'severity' => ['sometimes', 'nullable', 'string', 'in:' . implode(',', ClinicComplaint::SEVERITIES)],
            'is_urgent' => ['sometimes', 'nullable', 'boolean'],
            'resolution_note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array{
     *     status: string|null,
     *     severity: string|null,
     *     is_urgent: bool|null,
     *     resolution_note: string|null
     * }
     */
    public function changes(): array
    {
        $v = $this->validated();

        return [
            'status' => $v['status'] ?? null,
            'severity' => $v['severity'] ?? null,
            'is_urgent' => array_key_exists('is_urgent', $v) ? (bool) $v['is_urgent'] : null,
            'resolution_note' => $v['resolution_note'] ?? null,
        ];
    }
}
