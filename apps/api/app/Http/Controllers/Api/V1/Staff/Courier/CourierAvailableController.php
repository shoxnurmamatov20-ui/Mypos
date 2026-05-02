<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier;

use App\Domain\Order\Models\Order;
use App\Http\Controllers\Api\V1\Staff\Courier\Concerns\EnsuresCourier;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Staff\Courier\AvailableOrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CourierAvailableController extends Controller
{
    use EnsuresCourier;

    /**
     * GET /api/v1/staff/courier/available
     *
     * Paginated list of unassigned ready-to-pickup delivery orders.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->courier($request);

        $perPage = min((int) $request->integer('per_page', 20), 100);

        $orders = Order::query()
            ->where('type', 'delivery')
            ->where('status', 'ready')
            ->whereNull('courier_id')
            ->whereNull('cancelled_at')
            ->with(['items', 'customer'])
            ->orderBy('prepared_at')
            ->orderBy('created_at')
            ->paginate($perPage);

        return AvailableOrderResource::collection($orders);
    }
}
