<?php

declare(strict_types=1);

namespace App\Filament\Resources\TableCategoryResource\Pages;

use App\Filament\Resources\TableCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListTableCategories extends ListRecords
{
    protected static string $resource = TableCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
