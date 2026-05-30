<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Payment;

use App\Domain\Payment\Models\Payment;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentListController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,authorized,captured,failed,refunded,cancelled'],
            'provider' => ['nullable', 'string', 'in:cash,card,click,payme,uzum,apelsin'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Payment::query()->orderByDesc('created_at');

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }
        if (! empty($data['provider'])) {
            $query->where('provider', $data['provider']);
        }
        if (! empty($data['from'])) {
            $query->where('created_at', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $query->where('created_at', '<=', $data['to']);
        }

        return JsonResource::collection(
            $query->paginate($data['per_page'] ?? 20),
        );
    }
}
