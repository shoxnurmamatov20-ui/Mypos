<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards `/api/v1/staff/*` — ensures the Sanctum-authenticated user has at
 * least one active Employee record in their tenant. Attaches the matching
 * Employee to the request as `request->employee` for controllers to use.
 */
class EnsureActiveStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => __('Tizimga kirish talab qilinadi')], 401);
        }

        $employee = Employee::query()
            ->where('user_uuid', $user->uuid)
            ->where('status', EmployeeStatus::Active->value)
            ->whereNull('deleted_at')
            ->orderByDesc('hire_date')
            ->first();

        if ($employee === null) {
            return response()->json([
                'message' => __('Sizda faol xodim profili yo\'q'),
            ], 403);
        }

        $request->attributes->set('employee', $employee);

        return $next($request);
    }
}
