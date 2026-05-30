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
        $this->authorize('viewAny', Customer::class);

        $query = Customer::query()
            ->with('loyaltyAccount')
            ->orderByDesc('last_visit_at')
            ->orderByDesc('created_at');

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            // phone & email are now encrypted at rest (CLAUDE.md §7) so
            // ilike cannot match inside the ciphertext. We support exact
            // phone lookup via the HMAC `phone_index`, plus name fuzzy search.
            $phoneDigits = (string) preg_replace('/\D/', '', $search);
            // MySQL utf8mb4_unicode_ci collation makes LIKE case-insensitive,
            // matching the previous Postgres ILIKE behaviour. Driver-portable.
            $likeOp = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql'
                ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $phoneDigits, $likeOp): void {
                $q->where('first_name', $likeOp, "%{$search}%")
                    ->orWhere('last_name', $likeOp, "%{$search}%");
                if (strlen($phoneDigits) >= 9) {
                    $q->orWhere('phone_index', Customer::hashPhone($search));
                }
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
        $this->authorize('view', $customer);

        return CustomerResource::make($customer->load('loyaltyAccount'));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = $this->createCustomer->execute($request->validated());

        return response()->json(
            ['data' => CustomerResource::make($customer->load('loyaltyAccount'))],
            201,
        );
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $this->authorize('update', $customer);

        $customer->update($request->validated());

        return CustomerResource::make($customer->fresh()->load('loyaltyAccount'));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        return response()->json(['data' => ['message' => "Mijoz o'chirildi"]]);
    }
}
