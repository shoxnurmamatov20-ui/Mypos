<?php

declare(strict_types=1);

namespace App\Domain\Department\Actions;

use App\Domain\Department\Models\Department;
use Illuminate\Validation\ValidationException;

class CreateDepartmentAction
{
    /**
     * @param  array{name: string, description?: string|null, is_active?: bool, sort_order?: int}  $data
     */
    public function execute(string $tenantId, array $data): Department
    {
        $name = self::normalizeName($data['name']);

        $exists = Department::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => "Bu nomli bo'lim allaqachon mavjud",
            ]);
        }

        return Department::create([
            'tenant_id' => $tenantId,
            'name' => $name,
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
    }

    public static function normalizeName(string $name): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $name));
    }
}
