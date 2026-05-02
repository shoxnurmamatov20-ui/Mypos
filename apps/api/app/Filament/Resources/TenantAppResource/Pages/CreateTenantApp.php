<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppResource\Pages;

use App\Filament\Resources\TenantAppResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTenantApp extends CreateRecord
{
    protected static string $resource = TenantAppResource::class;

    protected function getRedirectUrl(): string
    {
        // Land on the View page after create so the owner immediately sees
        // the "Generate build" action surfaced for their new app.
        return TenantAppResource::getUrl('view', ['record' => $this->getRecord()]);
    }
}
