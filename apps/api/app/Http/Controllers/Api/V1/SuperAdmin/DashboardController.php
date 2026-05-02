<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Services\DashboardChartsService;
use App\Domain\SuperAdmin\Services\DashboardKpiService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(DashboardKpiService $kpis): JsonResponse
    {
        return response()->json([
            'data' => $kpis->compute(),
        ]);
    }

    public function charts(Request $request, DashboardChartsService $charts): JsonResponse
    {
        $range = (string) $request->query('range', '30d');
        if (! in_array($range, ['7d', '30d', '90d', '1y'], true)) {
            $range = '30d';
        }

        return response()->json([
            'data' => $charts->compute($range),
            'meta' => ['range' => $range],
        ]);
    }
}
