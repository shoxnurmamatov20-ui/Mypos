<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff\Courier\Concerns;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Models\Employee;
use App\Domain\Order\Models\Order;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Shared guards used by every courier controller. Avoids duplicating the
 * same role/tenant/ownership checks across 9 endpoints.
 */
trait EnsuresCourier
{
    private function courier(Request $request): Employee
    {
        /** @var Employee|null $employee */
        $employee = $request->attributes->get('employee');

        if ($employee === null) {
            throw new HttpException(403, __('Xodim profili topilmadi'));
        }

        $role = EmployeeRole::tryFrom($employee->position);
        if ($role !== EmployeeRole::Courier) {
            throw new HttpException(403, __('Faqat kuryerlar bu amalni bajarishi mumkin'));
        }

        return $employee;
    }

    /**
     * Ensure the order is in the same tenant as the courier and is a
     * delivery order. Used by accept/pickup/deliver/cancel endpoints.
     */
    private function assertOrderInTenant(Employee $courier, Order $order): void
    {
        if ($order->tenant_id !== $courier->tenant_id) {
            throw new HttpException(404, __('Buyurtma topilmadi'));
        }
    }
}
