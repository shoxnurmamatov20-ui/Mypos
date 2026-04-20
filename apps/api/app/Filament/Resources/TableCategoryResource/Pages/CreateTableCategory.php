<?php

declare(strict_types=1);

namespace App\Filament\Resources\TableCategoryResource\Pages;

use App\Filament\Resources\TableCategoryResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTableCategory extends CreateRecord
{
    protected static string $resource = TableCategoryResource::class;
}
