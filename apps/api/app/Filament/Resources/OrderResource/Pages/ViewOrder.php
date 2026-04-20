<?php

declare(strict_types=1);

namespace App\Filament\Resources\OrderResource\Pages;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Models\Order;
use App\Filament\Resources\OrderResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Pages\ViewRecord;

class ViewOrder extends ViewRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('changeStatus')
                ->label('Statusni o\'zgartirish')
                ->icon('heroicon-o-arrow-path')
                ->color('warning')
                ->form([
                    Forms\Components\Select::make('status')
                        ->label('Yangi status')
                        ->options(collect(OrderStatus::cases())
                            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                            ->toArray())
                        ->required(),
                ])
                ->action(function (Order $record, array $data): void {
                    $record->update(['status' => $data['status']]);
                }),
        ];
    }
}
