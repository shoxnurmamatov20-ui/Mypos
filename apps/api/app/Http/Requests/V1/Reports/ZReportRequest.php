<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Reports;

use App\Domain\Reports\Policies\ReportPolicy;
use Illuminate\Foundation\Http\FormRequest;

class ZReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user === null) {
            return false;
        }
        return (new ReportPolicy())->viewAny($user);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        // Allow backdated Z-reports up to 2 years, refuse forward-dating
        // beyond tomorrow (Tashkent timezone safety buffer).
        return [
            'date' => [
                'nullable',
                'date',
                'after_or_equal:'.now()->subYears(2)->toDateString(),
                'before_or_equal:'.now()->addDay()->toDateString(),
            ],
        ];
    }
}
