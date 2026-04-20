<?php

declare(strict_types=1);

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Database\Eloquent\Collection;

/**
 * Returns ingredients whose current_stock has dropped to or below min_stock.
 * Only ingredients with a configured min_stock are evaluated.
 *
 * @method Collection<int, Ingredient> __invoke()
 */
class LowStockReportAction
{
    /** @return Collection<int, Ingredient> */
    public function __invoke(): Collection
    {
        return Ingredient::query()
            ->with('category')
            ->where('is_active', true)
            ->lowStock()
            ->orderBy('name->uz')
            ->get();
    }
}
