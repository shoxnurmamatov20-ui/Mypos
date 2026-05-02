<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Filament\Resources\KioskDeviceResource\Pages;
use App\Filament\Resources\KioskDeviceResource\Schemas\KioskDeviceActions;
use App\Filament\Resources\KioskDeviceResource\Schemas\KioskDeviceFormSchema;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class KioskDeviceResource extends Resource
{
    protected static ?string $model = KioskDevice::class;

    protected static ?string $navigationIcon = 'heroicon-o-computer-desktop';

    protected static ?string $navigationGroup = 'Operatsiyalar';

    protected static ?string $modelLabel = 'Kiosk';

    protected static ?string $pluralModelLabel = 'Kiosklar';

    protected static ?int $navigationSort = 5;

    /** @var array<int, string> */
    protected static array $globalSearchAttributes = [
        'name',
        'location_label',
    ];

    /** @return array<int, string> */
    public static function getGloballySearchableAttributes(): array
    {
        return self::$globalSearchAttributes;
    }

    public static function form(Form $form): Form
    {
        return $form->schema(KioskDeviceFormSchema::sections());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions(KioskDeviceActions::rowActions())
            ->bulkActions(KioskDeviceActions::bulkActions());
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListKioskDevices::route('/'),
            'create' => Pages\CreateKioskDevice::route('/create'),
            'view' => Pages\ViewKioskDevice::route('/{record}'),
            'edit' => Pages\EditKioskDevice::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('name')
                ->label('Nomi')
                ->searchable()
                ->sortable()
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('location_label')
                ->label('Joylashuv')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('status')
                ->label('Holati')
                ->badge()
                ->formatStateUsing(fn (string $state): string => KioskDeviceStatus::tryFrom($state)?->label() ?? $state)
                ->color(fn (string $state): string => KioskDeviceStatus::tryFrom($state)?->color() ?? 'gray'),
            Tables\Columns\TextColumn::make('language')
                ->label('Til')
                ->formatStateUsing(fn (?string $state): string => self::languageLabel($state))
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('device_token_last4')
                ->label('Token')
                ->state(fn (KioskDevice $record): string => $record->device_token_last4 !== null
                    ? '****' . $record->device_token_last4
                    : '—')
                ->fontFamily('mono')
                ->copyable()
                ->copyableState(fn (KioskDevice $record): ?string => $record->device_token_last4)
                ->toggleable(),
            Tables\Columns\TextColumn::make('paired_at')
                ->label("Bog'langan")
                ->dateTime('d.m.Y H:i')
                ->placeholder('—')
                ->sortable()
                ->toggleable(),
            Tables\Columns\TextColumn::make('last_seen_at')
                ->label("Oxirgi ko'rinish")
                ->since()
                ->placeholder('—')
                ->sortable()
                ->description(fn (KioskDevice $record): string => $record->last_seen_at
                    ?->translatedFormat('d.m.Y H:i') ?? ''),
            Tables\Columns\TextColumn::make('idle_timeout_seconds')
                ->label('Idle (s)')
                ->numeric()
                ->toggleable(isToggledHiddenByDefault: true),
            Tables\Columns\TextColumn::make('created_at')
                ->label('Yaratilgan')
                ->dateTime('d.m.Y H:i')
                ->sortable()
                ->toggleable(isToggledHiddenByDefault: true),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('status')
                ->label('Holati')
                ->options(collect(KioskDeviceStatus::cases())
                    ->mapWithKeys(fn (KioskDeviceStatus $s) => [$s->value => $s->label()])
                    ->toArray()),
            Tables\Filters\SelectFilter::make('language')
                ->label('Til')
                ->options([
                    'uz' => "O'zbekcha",
                    'ru' => 'Русский',
                    'en' => 'English',
                ]),
            Tables\Filters\TrashedFilter::make(),
        ];
    }

    private static function languageLabel(?string $code): string
    {
        return match ($code) {
            'uz' => "O'zbekcha",
            'ru' => 'Русский',
            'en' => 'English',
            default => '—',
        };
    }
}
