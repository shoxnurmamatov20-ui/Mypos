<?php

declare(strict_types=1);

namespace App\Domain\Department\Actions;

use App\Domain\Department\Models\Department;
use Illuminate\Validation\ValidationException;

class UpdateDepartmentAction
{
    /**
     * @param  array{name?: string, description?: string|null, is_active?: bool, sort_order?: int}  $data
     */
    public function execute(Department $department, array $data): Department
    {
        if (isset($data['name'])) {
            $name = CreateDepartmentAction::normalizeName($data['name']);

            $exists = Department::query()
                ->where('tenant_id', $department->tenant_id)
                ->where('id', '!=', $department->id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'name' => "Bu nomli bo'lim allaqachon mavjud",
                ]);
            }

            $data['name'] = $name;
        }

        $department->update($data);

        return $department->fresh() ?? $department;
    }
}
