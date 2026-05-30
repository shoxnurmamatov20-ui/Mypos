<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Reports;

use App\Domain\Reports\Policies\ReportPolicy;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared base — every reports endpoint accepts an optional date range plus
 * a sort qualifier. Concrete reports (tables, waiters, courier, etc.)
 * extend this and append their own sort whitelist if needed.
 */
class DateRangeReportRequest extends FormRequest
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
        $maxFuture = now()->addDay()->toDateString();
        $minPast = now()->subYears(2)->toDateString();

        return [
            'from' => ['nullable', 'date', 'after_or_equal:'.$minPast, 'before_or_equal:'.$maxFuture],
            'to' => ['nullable', 'date', 'after_or_equal:from', 'before_or_equal:'.$maxFuture],
            // Sort is validated in concrete subclasses via Rule::in(...). The
            // default whitelist here accepts the common "-column" / "column"
            // shape; concrete subclasses can override with a strict enum.
            'sort' => ['nullable', 'string', 'max:32', 'regex:/^-?[a-z_]{1,30}$/'],
        ];
    }
}
