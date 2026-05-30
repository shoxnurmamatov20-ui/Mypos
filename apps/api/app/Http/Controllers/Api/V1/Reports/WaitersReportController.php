<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\WaitersReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\DateRangeReportRequest;
use Illuminate\Http\JsonResponse;

class WaitersReportController extends Controller
{
    public function index(
        DateRangeReportRequest $request,
        WaitersReportService $service,
    ): JsonResponse {
        $payload = $service->generate(
            $request->input('from'),
            $request->input('to'),
            (string) $request->input('sort', '-revenue'),
        );

        return response()->json($payload);
    }
}
