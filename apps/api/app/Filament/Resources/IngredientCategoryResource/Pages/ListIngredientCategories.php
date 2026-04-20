<?php

declare(strict_types=1);

namespace App\Filament\Resources\IngredientCategoryResource\Pages;

use App\Filament\Resources\IngredientCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListIngredientCategories extends ListRecords
{
    protected static string $resource = IngredientCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
