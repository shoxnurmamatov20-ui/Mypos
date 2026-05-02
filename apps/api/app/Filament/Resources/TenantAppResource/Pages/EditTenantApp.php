<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppResource\Pages;

use App\Domain\Tenant\Models\TenantApp;
use App\Filament\Resources\TenantAppResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTenantApp extends EditRecord
{
    protected static string $resource = TenantAppResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('generate_build')
                ->label(__('app.actions.generate_build'))
                ->icon('heroicon-o-rocket-launch')
                ->color('primary')
                ->requiresConfirmation()
                ->modalHeading(fn (): string => __('app.actions.generate_build_confirm_title'))
                ->modalDescription(fn (): string => __('app.actions.generate_build_confirm_body'))
                ->visible(fn (): bool => $this->record instanceof TenantApp && $this->record->isBuildable())
                ->action(function (): void {
                    /** @var TenantApp $record */
                    $record = $this->record;
                    TenantAppResource::dispatchBuild($record);
                }),
            Actions\ViewAction::make(),
            Actions\DeleteAction::make(),
        ];
    }
}
