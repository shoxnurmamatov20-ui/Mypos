<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\CEO;

use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Foundation\Http\FormRequest;

class ListComplaintsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Endpoint is already protected by EnsureCEO middleware.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:200'],
            'clinic_id' => ['nullable', 'integer', 'min:1'],
            'region' => ['nullable', 'string', 'max:100'],
            'severity' => ['nullable', 'string', 'in:' . implode(',', ClinicComplaint::SEVERITIES)],
            'status' => ['nullable', 'string', 'in:' . implode(',', ClinicComplaint::STATUSES)],
            'urgent' => ['nullable', 'boolean'],
            'stale' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'sort' => ['nullable', 'string', 'in:created_at,severity,status,resolved_at'],
            'dir' => ['nullable', 'string', 'in:asc,desc'],
            'per' => ['nullable', 'integer', 'min:10', 'max:200'],
        ];
    }

    /**
     * @return array{
     *     q: string|null,
     *     clinic_id: int|null,
     *     region: string|null,
     *     severity: string|null,
     *     status: string|null,
     *     urgent: bool|null,
     *     stale: bool|null,
     *     from: string|null,
     *     to: string|null,
     *     sort: string|null,
     *     dir: string|null,
     *     per: int|null
     * }
     */
    public function filters(): array
    {
        $v = $this->validated();

        return [
            'q' => $v['q'] ?? null,
            'clinic_id' => isset($v['clinic_id']) ? (int) $v['clinic_id'] : null,
            'region' => $v['region'] ?? null,
            'severity' => $v['severity'] ?? null,
            'status' => $v['status'] ?? null,
            'urgent' => array_key_exists('urgent', $v) ? (bool) $v['urgent'] : null,
            'stale' => array_key_exists('stale', $v) ? (bool) $v['stale'] : null,
            'from' => $v['from'] ?? null,
            'to' => $v['to'] ?? null,
            'sort' => $v['sort'] ?? null,
            'dir' => $v['dir'] ?? null,
            'per' => isset($v['per']) ? (int) $v['per'] : null,
        ];
    }
}
