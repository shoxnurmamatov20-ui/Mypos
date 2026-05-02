<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Pages;

use App\Filament\Resources\KioskDeviceResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewKioskDevice extends ViewRecord
{
    protected static string $resource = KioskDeviceResource::class;

    /** @return array<int, Actions\Action> */
    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
        ];
    }
}
