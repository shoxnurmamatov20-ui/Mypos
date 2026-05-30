<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\TablesReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\DateRangeReportRequest;
use Illuminate\Http\JsonResponse;

class TablesReportController extends Controller
{
    public function index(
        DateRangeReportRequest $request,
        TablesReportService $service,
    ): JsonResponse {
        $payload = $service->generate(
            $request->input('from'),
            $request->input('to'),
            (string) $request->input('sort', '-revenue'),
        );

        return response()->json($payload);
    }
}
