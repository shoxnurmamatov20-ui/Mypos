<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Notification\Models\NotificationLog;
use App\Filament\Resources\NotificationLogResource\Pages;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class NotificationLogResource extends Resource
{
    protected static ?string $model = NotificationLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-bell-alert';

    protected static ?string $navigationGroup = 'Operatsiyalar';

    protected static ?string $modelLabel = 'Bildirishnoma';

    protected static ?string $pluralModelLabel = 'Bildirishnomalar';

    protected static ?int $navigationSort = 9;

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('channel')
                    ->label('Kanal')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => NotificationChannel::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('template')
                    ->label('Shablon')
                    ->searchable()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('recipient')
                    ->label('Qabul qiluvchi')
                    ->searchable()
                    ->limit(32),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color(fn (string $state): string => NotificationStatus::tryFrom($state)?->color() ?? 'gray')
                    ->formatStateUsing(fn (string $state): string => NotificationStatus::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('sent_at')
                    ->label('Yuborilgan')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('channel')
                    ->label('Kanal')
                    ->options(collect(NotificationChannel::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(NotificationStatus::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('Dan'),
                        Forms\Components\DatePicker::make('until')->label('Gacha'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNotificationLogs::route('/'),
            'view' => Pages\ViewNotificationLog::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes(['tenant']);
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
