<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\CourierReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\DateRangeReportRequest;
use Illuminate\Http\JsonResponse;

class CourierReportController extends Controller
{
    public function index(
        DateRangeReportRequest $request,
        CourierReportService $service,
    ): JsonResponse {
        $tenantId = (string) ($request->user()?->tenant_id ?? '');
        if ($tenantId === '') {
            return response()->json([
                'data' => [],
                'meta' => ['locked' => false],
            ]);
        }

        $payload = $service->generate(
            $tenantId,
            $request->input('from'),
            $request->input('to'),
            (string) $request->input('sort', '-deliveries'),
        );

        return response()->json($payload);
    }
}
