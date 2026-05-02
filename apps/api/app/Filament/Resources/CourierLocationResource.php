<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Employee\Models\CourierLocation;
use App\Filament\Resources\CourierLocationResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Read-only resource for browsing courier GPS pings.
 *
 * Couriers stream coordinates from the staff-mobile app while delivering
 * orders. Admins use this resource to audit routes / debug delivery
 * issues; no Filament-side writes are permitted.
 */
class CourierLocationResource extends Resource
{
    protected static ?string $model = CourierLocation::class;

    protected static ?string $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationGroup = 'HR';

    protected static ?string $navigationLabel = 'Kuryer joylashuvi';

    protected static ?string $modelLabel = 'Joylashuv';

    protected static ?string $pluralModelLabel = 'Kuryer joylashuvi';

    protected static ?int $navigationSort = 6;

    public static function form(Form $form): Form
    {
        // Read-only resource — schema is irrelevant but kept minimal for safety.
        return $form->schema([
            Forms\Components\Placeholder::make('readonly_notice')
                ->label('')
                ->content(
                    "Kuryer joylashuvi faqat o'qish uchun. Yozuvlar mobil "
                    . 'ilovadan kelib chiqadi.'
                ),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('recorded_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCourierLocations::route('/'),
            'view' => Pages\ViewCourierLocation::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['employee.user', 'order']);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit(Model $record): bool
    {
        return false;
    }

    public static function canDelete(Model $record): bool
    {
        return false;
    }

    public static function canDeleteAny(): bool
    {
        return false;
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('employee.user.name')
                ->label('Kuryer')
                ->weight('semibold')
                ->searchable(['users.name'])
                ->sortable()
                ->placeholder('—'),
            Tables\Columns\TextColumn::make('lat')
                ->label('Kenglik')
                ->numeric(decimalPlaces: 6)
                ->copyable(),
            Tables\Columns\TextColumn::make('lng')
                ->label("Bo'ylama")
                ->numeric(decimalPlaces: 6)
                ->copyable(),
            Tables\Columns\TextColumn::make('accuracy_meters')
                ->label('Aniqlik')
                ->state(fn (CourierLocation $record): string => $record->accuracy_meters !== null
                    ? rtrim(rtrim((string) $record->accuracy_meters, '0'), '.') . ' m'
                    : '—')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('speed_mps')
                ->label('Tezlik')
                ->state(fn (CourierLocation $record): string => self::formatSpeedKmh($record))
                ->badge()
                ->color(fn (CourierLocation $record): string => self::speedColor($record))
                ->toggleable(),
            Tables\Columns\TextColumn::make('battery_percent')
                ->label('Batareya')
                ->state(fn (CourierLocation $record): string => $record->battery_percent !== null
                    ? $record->battery_percent . '%'
                    : '—')
                ->badge()
                ->color(fn (CourierLocation $record): string => self::batteryColor($record->battery_percent))
                ->toggleable(),
            Tables\Columns\TextColumn::make('order.order_no')
                ->label('Buyurtma')
                ->state(fn (CourierLocation $record): string => $record->order?->order_no !== null
                    ? '#' . $record->order->order_no
                    : '—')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('recorded_at')
                ->label('Yozilgan vaqti')
                ->since()
                ->description(fn (CourierLocation $record): string => $record->recorded_at
                    ?->translatedFormat('d.m.Y H:i:s') ?? '')
                ->sortable(),
            Tables\Columns\TextColumn::make('created_at')
                ->label('Tizimga tushdi')
                ->dateTime('d.m.Y H:i')
                ->toggleable(isToggledHiddenByDefault: true)
                ->sortable(),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('employee_id')
                ->label('Kuryer')
                ->relationship('employee', 'employee_code')
                ->searchable()
                ->preload(),
            Tables\Filters\Filter::make('recorded_at')
                ->label('Yozilgan davr')
                ->form([
                    Forms\Components\DatePicker::make('from')
                        ->label('Boshlanish')
                        ->native(false),
                    Forms\Components\DatePicker::make('until')
                        ->label('Tugash')
                        ->native(false),
                ])
                ->query(function (Builder $query, array $data): Builder {
                    return $query
                        ->when(
                            $data['from'] ?? null,
                            fn (Builder $q, $date) => $q->whereDate('recorded_at', '>=', $date),
                        )
                        ->when(
                            $data['until'] ?? null,
                            fn (Builder $q, $date) => $q->whereDate('recorded_at', '<=', $date),
                        );
                }),
            Tables\Filters\TernaryFilter::make('has_order')
                ->label('Buyurtmaga bog\'langan')
                ->placeholder('Hammasi')
                ->trueLabel('Faqat buyurtmali')
                ->falseLabel('Faqat boshqa')
                ->queries(
                    true: fn (Builder $q) => $q->whereNotNull('order_id'),
                    false: fn (Builder $q) => $q->whereNull('order_id'),
                    blank: fn (Builder $q) => $q,
                ),
        ];
    }

    private static function formatSpeedKmh(CourierLocation $record): string
    {
        if ($record->speed_mps === null) {
            return '—';
        }
        $kmh = (float) $record->speed_mps * 3.6;
        return number_format($kmh, 1, '.', ' ') . ' km/h';
    }

    private static function speedColor(CourierLocation $record): string
    {
        if ($record->speed_mps === null) {
            return 'gray';
        }
        $kmh = (float) $record->speed_mps * 3.6;
        if ($kmh < 1.0) {
            return 'gray';
        }
        if ($kmh < 25.0) {
            return 'success';
        }
        if ($kmh < 60.0) {
            return 'warning';
        }
        return 'danger';
    }

    private static function batteryColor(?int $percent): string
    {
        if ($percent === null) {
            return 'gray';
        }
        if ($percent <= 15) {
            return 'danger';
        }
        if ($percent <= 35) {
            return 'warning';
        }
        return 'success';
    }
}
