<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\CashflowReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\CashflowReportRequest;
use Illuminate\Http\JsonResponse;

class CashflowReportController extends Controller
{
    public function index(
        CashflowReportRequest $request,
        CashflowReportService $service,
    ): JsonResponse {
        $payload = $service->generate(
            $request->input('from'),
            $request->input('to'),
            (string) $request->input('group_by', 'day'),
        );

        return response()->json($payload);
    }
}
