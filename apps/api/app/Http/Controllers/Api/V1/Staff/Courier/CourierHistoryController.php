<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Staff\Courier\DeliveryHistoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CourierHistoryController extends Controller
{
    use EnsuresCourier;

    /**
     * GET /api/v1/staff/courier/history?per_page=20&from&to
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $courier = $this->courier($request);

        $perPage = min((int) $request->integer('per_page', 20), 100);

        $query = Order::query()
            ->where('courier_id', $courier->id)
            ->where('type', 'delivery')
            ->whereNotNull('delivered_at')
            ->with(['customer'])
            ->orderByDesc('delivered_at');

        if ($request->filled('from')) {
            $query->where('delivered_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->where('delivered_at', '<=', $request->date('to'));
        }

        return DeliveryHistoryResource::collection($query->paginate($perPage));
    }
}
