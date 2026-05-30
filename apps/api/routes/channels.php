<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\Role as RoleEnum;
use App\Domain\Order\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channel Authorization
|--------------------------------------------------------------------------
|
| Reverb (Pusher protocol) calls back to /broadcasting/auth (registered in
| routes/api.php under auth:sanctum) for every private channel subscription.
| The closures below decide whether the authenticated `User` may listen on
| each channel name.
|
| Channel topology:
|   tenant.{tenantId}.kitchen     KDS line — chef / manager / owner
|   tenant.{tenantId}.dashboard   Owner counters — manager / owner
|   tenant.{tenantId}.staff       Generic staff (waiter / cashier / chef ...)
|   order.{orderId}               Per-order updates — staff or guest token
|
| Every callback:
|   - rejects null users (Reverb refuses the subscription)
|   - validates tenant ownership (defense-in-depth above the global scope)
|   - returns false (not 403) on missing role so Reverb cleanly tells client
*/

Broadcast::channel('tenant.{tenantId}.kitchen', function (?User $user, string $tenantId): bool {
    if ($user === null || $user->tenant_id !== $tenantId) {
        return false;
    }

    return $user->hasAnyRole([
        RoleEnum::Chef->value,
        RoleEnum::Manager->value,
        RoleEnum::Owner->value,
    ]);
});

Broadcast::channel('tenant.{tenantId}.dashboard', function (?User $user, string $tenantId): bool {
    if ($user === null || $user->tenant_id !== $tenantId) {
        return false;
    }

    // Dashboard exposes revenue / staff productivity / etc — gate to leadership.
    return $user->hasAnyRole([
        RoleEnum::Manager->value,
        RoleEnum::Owner->value,
    ]);
});

Broadcast::channel('tenant.{tenantId}.staff', function (?User $user, string $tenantId): bool {
    if ($user === null || $user->tenant_id !== $tenantId) {
        return false;
    }

    return $user->hasAnyRole([
        RoleEnum::Owner->value,
        RoleEnum::Manager->value,
        RoleEnum::Cashier->value,
        RoleEnum::Waiter->value,
        RoleEnum::Chef->value,
        RoleEnum::Courier->value,
    ]);
});

/*
 * Per-employee staff channels (added 2026-05-14).
 *
 *   tenant.{tenantId}.waiter.{employeeId}  — kitchen.item.ready, customer.call
 *   courier.{employeeId}                   — delivery.offered, delivery.cancelled
 *
 * The waiter channel scope encodes BOTH tenant + employee, so only the
 * targeted waiter receives "your item is ready" pings. The courier channel
 * is employee-scoped only (no tenant prefix) because couriers can deliver
 * across tenants in the future marketplace mode.
 */
Broadcast::channel(
    'tenant.{tenantId}.waiter.{employeeId}',
    function (?User $user, string $tenantId, string $employeeId): bool {
        if ($user === null || $user->tenant_id !== $tenantId) {
            return false;
        }

        $employee = $user->employee;
        if ($employee === null || $employee->id !== $employeeId) {
            return false;
        }

        return in_array(
            $employee->position,
            ['waiter', 'cashier', 'manager', 'owner'],
            true,
        );
    },
);

Broadcast::channel('courier.{employeeId}', function (?User $user, string $employeeId): bool {
    if ($user === null) {
        return false;
    }

    $employee = $user->employee;
    if ($employee === null || $employee->id !== $employeeId) {
        return false;
    }

    return $employee->position === 'courier';
});

Broadcast::channel('order.{orderId}', function (?User $user, string $orderId): bool {
    // Two valid paths to listen on an order channel:
    //   1) An authenticated tenant user whose tenant owns the order, OR
    //   2) A guest customer holding the tracking_token query param.
    //
    // The guest case is sent through the regular /broadcasting/auth route by
    // Pusher-JS — the client adds `?tracking_token=...` to the auth request
    // and we honour it here by scanning $_GET / $request->query() via the
    // Broadcast::routes() request bag.

    $request = request();
    $token = $request?->query('tracking_token');

    // Find the order without a global tenant scope so guests can authorize.
    /** @var Order|null $order */
    $order = Order::query()
        ->withoutGlobalScopes()
        ->whereKey($orderId)
        ->first();

    if ($order === null) {
        return false;
    }

    // Guest path — constant-time compare on the unguessable tracking_token.
    if (is_string($token) && $token !== '' && $order->tracking_token !== null) {
        if (hash_equals((string) $order->tracking_token, $token)) {
            return true;
        }
    }

    // Authenticated tenant path — must belong to the same tenant. We don't
    // require a particular role here because customers may also have a
    // `customer` role on their own orders in the future.
    if ($user === null) {
        return false;
    }

    return $user->tenant_id === $order->tenant_id;
});
