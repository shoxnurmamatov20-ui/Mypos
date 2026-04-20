<?php

declare(strict_types=1);

namespace App\Filament\Resources\IngredientCategoryResource\Pages;

use App\Filament\Resources\IngredientCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditIngredientCategory extends EditRecord
{
    protected static string $resource = IngredientCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
