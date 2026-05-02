<?php

declare(strict_types=1);

namespace App\Filament\Resources\ExchangeRateResource\Pages;

use App\Filament\Resources\ExchangeRateResource;
use App\Filament\Widgets\CurrentFxRatesWidget;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListExchangeRates extends ListRecords
{
    protected static string $resource = ExchangeRateResource::class;

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [
            CurrentFxRatesWidget::class,
        ];
    }

    /** @return array<int, mixed> */
    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
            Actions\Action::make('refresh_rates')
                ->label(__('region.fx.actions.refresh'))
                ->icon('heroicon-o-arrow-path')
                ->color('primary')
                ->requiresConfirmation()
                ->modalHeading(__('region.fx.actions.refresh_confirm_title'))
                ->modalDescription(__('region.fx.actions.refresh_confirm_body'))
                ->action(static function (): void {
                    ExchangeRateResource::dispatchRefresh();
                }),
        ];
    }
}
