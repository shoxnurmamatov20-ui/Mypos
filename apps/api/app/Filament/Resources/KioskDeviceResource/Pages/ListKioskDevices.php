<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Pages;

use App\Filament\Resources\KioskDeviceResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListKioskDevices extends ListRecords
{
    protected static string $resource = KioskDeviceResource::class;

    /** @return array<int, \Filament\Actions\Action> */
    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
