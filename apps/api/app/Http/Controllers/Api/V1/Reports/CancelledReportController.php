<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\CancelledReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\DateRangeReportRequest;
use Illuminate\Http\JsonResponse;

class CancelledReportController extends Controller
{
    public function index(
        DateRangeReportRequest $request,
        CancelledReportService $service,
    ): JsonResponse {
        $payload = $service->generate(
            $request->input('from'),
            $request->input('to'),
        );

        return response()->json($payload);
    }
}
