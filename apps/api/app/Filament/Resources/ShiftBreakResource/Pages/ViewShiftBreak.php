<?php

declare(strict_types=1);

namespace App\Filament\Resources\ShiftBreakResource\Pages;

use App\Filament\Resources\ShiftBreakResource;
use Filament\Resources\Pages\ViewRecord;

class ViewShiftBreak extends ViewRecord
{
    protected static string $resource = ShiftBreakResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
