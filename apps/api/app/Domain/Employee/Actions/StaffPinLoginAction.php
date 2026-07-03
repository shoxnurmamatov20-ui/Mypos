<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use App\Support\TenantGuc;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Authenticate a staff member by phone + PIN and issue a Sanctum token.
 *
 * Records every attempt in `staff_pin_attempts` for rate limiting and audit.
 */
class StaffPinLoginAction
{
    /**
     * @return array{user: User, employee: Employee, token: string}
     */
    public function __invoke(string $phone, string $pin, ?string $ip = null): array
    {
        $user = User::query()->where('phone', $phone)->first();

        // Pre-auth: `employees` is under strict RLS. The candidate's own
        // tenant_id (from the global users table) is authoritative — imprint
        // it so the lookup below can see exactly that tenant's rows.
        if ($user !== null && ! empty($user->tenant_id)) {
            TenantGuc::imprint((string) $user->tenant_id);
        }

        $employee = $user === null
            ? null
            : Employee::withoutGlobalScopes()
                ->where('user_uuid', $user->uuid)
                ->where('status', EmployeeStatus::Active->value)
                ->whereNull('deleted_at')
                ->orderByDesc('hire_date')
                ->first();

        $valid = $user !== null
            && $employee !== null
            && $employee->pin_code_hash !== null
            && Hash::check($pin, $employee->pin_code_hash);

        $this->recordAttempt(
            tenantId: $employee?->tenant_id,
            phone: $phone,
            ip: $ip,
            success: $valid,
        );

        if (! $valid || $user === null || $employee === null) {
            throw ValidationException::withMessages([
                'pin' => [__('Telefon yoki PIN-kod xato')],
            ])->status(401);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        // One token per device. Revoke previous staff-mobile tokens for clarity.
        $user->tokens()->where('name', 'staff-mobile')->delete();

        $token = $user->createToken('staff-mobile', ['*'], now()->addDays(30))->plainTextToken;

        return [
            'user' => $user->fresh(['tenant', 'roles']),
            'employee' => $employee->fresh(['user']),
            'token' => $token,
        ];
    }

    private function recordAttempt(?string $tenantId, string $phone, ?string $ip, bool $success): void
    {
        DB::table('staff_pin_attempts')->insert([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'phone' => $phone,
            'ip_address' => $ip,
            'success' => $success,
            'attempted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
