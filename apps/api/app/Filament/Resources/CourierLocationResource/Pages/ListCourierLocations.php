<?php

declare(strict_types=1);

namespace App\Filament\Resources\CourierLocationResource\Pages;

use App\Filament\Resources\CourierLocationResource;
use Filament\Resources\Pages\ListRecords;

class ListCourierLocations extends ListRecords
{
    protected static string $resource = CourierLocationResource::class;

    /** @return array<int, \Filament\Actions\Action> */
    protected function getHeaderActions(): array
    {
        // Read-only resource — no Create action.
        return [];
    }
}
