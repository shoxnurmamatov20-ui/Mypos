<?php

declare(strict_types=1);

namespace App\Filament\Resources\EmployeeResource\Pages;

use App\Domain\Employee\Models\Employee;
use App\Filament\Resources\EmployeeResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateEmployee extends CreateRecord
{
    protected static string $resource = EmployeeResource::class;

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        /** @var array<string, mixed> $userData */
        $userData = $data['user_data'] ?? [];
        unset($data['user_data']);

        $email = $userData['email'] ?? null;
        $tenantId = $data['tenant_id'] ?? null;

        if (! empty($email)) {
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $userData['name'] ?? 'Employee',
                    'phone' => $userData['phone'] ?? null,
                    'locale' => $userData['locale'] ?? 'uz',
                    'password' => Hash::make($userData['password'] ?? Str::random(16)),
                    'tenant_id' => $tenantId,
                    'email_verified_at' => now(),
                    'is_super_admin' => false,
                ],
            );
        } else {
            $user = User::create([
                'name' => $userData['name'] ?? 'Employee',
                'phone' => $userData['phone'] ?? null,
                'locale' => $userData['locale'] ?? 'uz',
                'password' => Hash::make($userData['password'] ?? Str::random(16)),
                'tenant_id' => $tenantId,
                'email_verified_at' => now(),
                'is_super_admin' => false,
            ]);
        }

        if (! empty($data['position']) && ! $user->hasRole((string) $data['position'])) {
            $user->assignRole((string) $data['position']);
        }

        $data['user_uuid'] = $user->uuid;

        if (empty($data['employee_code'])) {
            // Audit C-2 (ADR-0005 follow-up): the previous global count()
            // leaked the platform-wide employee total AND collided codes
            // across tenants. Generate per-tenant — same algorithm the
            // CreateEmployeeAction uses for API hires.
            $data['employee_code'] = $this->generateEmployeeCode((string) $tenantId);
        }

        return $data;
    }

    /**
     * Per-tenant sequential employee code with collision retry. Mirrors
     * \App\Domain\Employee\Actions\CreateEmployeeAction::generateEmployeeCode.
     */
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

    /**
     * @param  array<string, mixed>  $data
     */
    protected function handleRecordCreation(array $data): Model
    {
        return Employee::create($data);
    }
}
