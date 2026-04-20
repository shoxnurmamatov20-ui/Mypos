<?php

declare(strict_types=1);

namespace App\Domain\Employee\Actions;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateEmployeeAction
{
    /**
     * Hire an employee — creates (or reuses) the User record and links it to
     * a new Employee row. Assigns the Spatie role matching the position.
     *
     * @param  string  $tenantId  Tenant the employee belongs to.
     * @param  array{name: string, email: string, phone?: string|null, password: string, locale?: string}  $userData
     * @param  array{
     *     employee_code?: string|null,
     *     position: string,
     *     hire_date: string,
     *     base_salary?: int|null,
     *     hourly_rate?: int|null,
     *     status?: string,
     *     notes?: string|null,
     *     emergency_contact?: string|null,
     *     documents?: array<int, array{type: string, url: string, uploaded_at: string}>|null,
     * }  $employeeData
     */
    public function __invoke(string $tenantId, array $userData, array $employeeData): Employee
    {
        if (! in_array($employeeData['position'], Role::values(), true)) {
            throw ValidationException::withMessages([
                'position' => ["Lavozim noto'g'ri"],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $userData, $employeeData): Employee {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'tenant_id' => $tenantId,
                    'phone' => $userData['phone'] ?? null,
                    'locale' => $userData['locale'] ?? 'uz',
                    'password' => Hash::make($userData['password']),
                    'email_verified_at' => now(),
                    'is_super_admin' => false,
                ],
            );

            if (! $user->hasRole($employeeData['position'])) {
                $user->assignRole($employeeData['position']);
            }

            $employeeCode = $employeeData['employee_code'] ?? $this->generateEmployeeCode($tenantId);

            $employee = Employee::create([
                'tenant_id' => $tenantId,
                'user_uuid' => $user->uuid,
                'employee_code' => $employeeCode,
                'position' => $employeeData['position'],
                'hire_date' => $employeeData['hire_date'],
                'base_salary' => $employeeData['base_salary'] ?? null,
                'hourly_rate' => $employeeData['hourly_rate'] ?? null,
                'status' => $employeeData['status'] ?? EmployeeStatus::Active->value,
                'notes' => $employeeData['notes'] ?? null,
                'emergency_contact' => $employeeData['emergency_contact'] ?? null,
                'documents' => $employeeData['documents'] ?? null,
            ]);

            return $employee->load('user');
        });
    }

    private function generateEmployeeCode(string $tenantId): string
    {
        $count = Employee::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->count();

        do {
            $candidate = 'EMP-' . str_pad((string) (++$count), 4, '0', STR_PAD_LEFT);
            $exists = Employee::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('employee_code', $candidate)
                ->exists();
        } while ($exists);

        return $candidate;
    }
}
