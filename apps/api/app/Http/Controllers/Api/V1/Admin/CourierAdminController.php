<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Employee\Models\CourierLocation;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

class CourierAdminController extends Controller
{
    public function locations(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'employee_id' => ['nullable', 'string', 'uuid'],
            'order_id' => ['nullable', 'string', 'uuid'],
            'since' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = CourierLocation::query()
            ->orderByDesc('recorded_at');

        if (! empty($data['employee_id'])) {
            $query->where('employee_id', $data['employee_id']);
        }
        if (! empty($data['order_id'])) {
            $query->where('order_id', $data['order_id']);
        }
        if (! empty($data['since'])) {
            $query->where('recorded_at', '>=', $data['since']);
        }

        return JsonResource::collection(
            $query->paginate($data['per_page'] ?? 50),
        );
    }
}
