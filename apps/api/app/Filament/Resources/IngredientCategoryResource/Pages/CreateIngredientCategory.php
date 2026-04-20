<?php

declare(strict_types=1);

namespace App\Filament\Resources\IngredientCategoryResource\Pages;

use App\Filament\Resources\IngredientCategoryResource;
use Filament\Resources\Pages\CreateRecord;

class CreateIngredientCategory extends CreateRecord
{
    protected static string $resource = IngredientCategoryResource::class;
}
