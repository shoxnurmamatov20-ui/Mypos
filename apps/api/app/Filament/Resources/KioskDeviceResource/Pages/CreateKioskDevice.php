<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Pages;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Filament\Resources\KioskDeviceResource;
use Filament\Resources\Pages\CreateRecord;

class CreateKioskDevice extends CreateRecord
{
    protected static string $resource = KioskDeviceResource::class;

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // New devices always start unpaired — pairing is initiated via the
        // dedicated row Action (which mints a 6-digit code) and finalised
        // by the kiosk client calling /api/v1/kiosk/pair.
        $data['status'] = KioskDeviceStatus::Unpaired->value;
        return $data;
    }
}
