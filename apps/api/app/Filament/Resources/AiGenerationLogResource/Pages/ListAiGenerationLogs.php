<?php

declare(strict_types=1);

namespace App\Filament\Resources\AiGenerationLogResource\Pages;

use App\Filament\Resources\AiGenerationLogResource;
use App\Filament\Widgets\AiCostWidget;
use Filament\Resources\Pages\ListRecords;

class ListAiGenerationLogs extends ListRecords
{
    protected static string $resource = AiGenerationLogResource::class;

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [
            AiCostWidget::class,
        ];
    }

    /** @return array<int, mixed> */
    protected function getHeaderActions(): array
    {
        return [];
    }
}
