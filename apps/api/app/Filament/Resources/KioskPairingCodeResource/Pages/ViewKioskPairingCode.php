<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskPairingCodeResource\Pages;

use App\Filament\Resources\KioskPairingCodeResource;
use Filament\Resources\Pages\ViewRecord;

class ViewKioskPairingCode extends ViewRecord
{
    protected static string $resource = KioskPairingCodeResource::class;

    /** @return array<int, \Filament\Actions\Action> */
    protected function getHeaderActions(): array
    {
        return [];
    }
}
