<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Reports;

use App\Domain\Reports\Services\ZReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Reports\ZReportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class ZReportController extends Controller
{
    public function show(ZReportRequest $request, ZReportService $service): JsonResponse
    {
        // Anchor the date to the report timezone (Asia/Tashkent by default) so
        // a manager running the Z-Report at 22:00 local on the 28th doesn't
        // miss orders placed 00:00–05:00 local that same day.
        $tz = (string) config('app.report_timezone', 'Asia/Tashkent');
        $date = $request->filled('date')
            ? Carbon::parse((string) $request->string('date'), $tz)
            : Carbon::now($tz);

        return response()->json(['data' => $service->generate($date)]);
    }
}
