<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskPairingCodeResource\Pages;

use App\Filament\Resources\KioskPairingCodeResource;
use Filament\Resources\Pages\ListRecords;

class ListKioskPairingCodes extends ListRecords
{
    protected static string $resource = KioskPairingCodeResource::class;

    /** @return array<int, \Filament\Actions\Action> */
    protected function getHeaderActions(): array
    {
        // Read-only resource — codes are minted from KioskDeviceResource.
        return [];
    }
}
