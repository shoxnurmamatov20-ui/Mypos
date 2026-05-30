<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\OrdersReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\OrdersReportRequest;
use App\Http\Resources\V1\Reports\ReportOrderResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrdersReportController extends Controller
{
    public function index(
        OrdersReportRequest $request,
        OrdersReportService $service,
    ): AnonymousResourceCollection {
        $result = $service->list($request->validated());

        return ReportOrderResource::collection($result['paginator'])
            ->additional([
                'meta' => [
                    'summary' => $result['summary'],
                ],
            ]);
    }
}
