<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\MenuItemsReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\MenuItemsReportRequest;
use Illuminate\Http\JsonResponse;

class MenuItemsReportController extends Controller
{
    public function index(
        MenuItemsReportRequest $request,
        MenuItemsReportService $service,
    ): JsonResponse {
        $payload = $service->generate(
            $request->input('from'),
            $request->input('to'),
            $request->input('category_id'),
            (string) $request->input('sort', '-revenue'),
        );

        return response()->json($payload);
    }
}
