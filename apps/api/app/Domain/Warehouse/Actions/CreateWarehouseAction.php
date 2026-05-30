<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Warehouse\Models\Warehouse;
use Illuminate\Support\Facades\DB;

/**
 * Creates a warehouse and enforces that only ONE warehouse per tenant can be
 * marked is_default=true. The trickiest case is when the caller passes
 * is_default=true while another warehouse already holds that flag — we flip
 * the existing one to false inside the same transaction.
 */
class CreateWarehouseAction
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   name: string,
     *   address?: string|null,
     *   is_active?: bool,
     *   is_default?: bool,
     *   sort_order?: int,
     *   notes?: string|null,
     * } $input
     */
    public function __invoke(array $input): Warehouse
    {
        return DB::transaction(function () use ($input): Warehouse {
            $isDefault = (bool) ($input['is_default'] ?? false);

            // We create the warehouse first so the BelongsToTenant trait can
            // resolve the auth tenant_id (the caller often omits it). Once
            // saved we know the real tenant_id and can safely demote siblings.
            /** @var Warehouse $warehouse */
            $warehouse = Warehouse::create([
                'tenant_id' => $input['tenant_id'] ?? null,
                'name' => $input['name'],
                'address' => $input['address'] ?? null,
                'is_active' => $input['is_active'] ?? true,
                'is_default' => $isDefault,
                'sort_order' => $input['sort_order'] ?? 0,
                'notes' => $input['notes'] ?? null,
            ]);

            if ($isDefault && $warehouse->tenant_id !== '') {
                Warehouse::query()
                    ->where('tenant_id', $warehouse->tenant_id)
                    ->where('id', '!=', $warehouse->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            return $warehouse;
        });
    }
}
