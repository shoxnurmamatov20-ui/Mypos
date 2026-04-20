<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Customer;

use App\Domain\Customer\Actions\CreateCustomerAction;
use App\Domain\Customer\Models\Customer;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Customer\StoreCustomerRequest;
use App\Http\Requests\V1\Customer\UpdateCustomerRequest;
use App\Http\Resources\V1\Customer\CustomerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CreateCustomerAction $createCustomer,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::query()
            ->with('loyaltyAccount')
            ->orderByDesc('last_visit_at')
            ->orderByDesc('created_at');

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('tag')) {
            $tag = (string) $request->string('tag');
            $query->whereJsonContains('tags', $tag);
        }

        if ($request->filled('tier')) {
            $tier = (string) $request->string('tier');
            $query->whereHas('loyaltyAccount', function ($q) use ($tier): void {
                $q->where('tier', $tier);
            });
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return CustomerResource::collection($query->paginate($perPage));
    }

    public function show(Customer $customer): CustomerResource
    {
        return CustomerResource::make($customer->load('loyaltyAccount'));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->createCustomer->execute($request->validated());

        return response()->json(
            ['data' => CustomerResource::make($customer->load('loyaltyAccount'))],
            201,
        );
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->update($request->validated());

        return CustomerResource::make($customer->fresh()->load('loyaltyAccount'));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json(['data' => ['message' => "Mijoz o'chirildi"]]);
    }
}
