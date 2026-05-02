<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Filament\Resources\KioskPairingCodeResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Read-only audit log of pairing codes generated for kiosk devices.
 *
 * Codes are minted via {@see App\Domain\Kiosk\Actions\GeneratePairingCodeAction}
 * (called from the row Action on KioskDeviceResource) and consumed via
 * {@see App\Domain\Kiosk\Actions\PairKioskDeviceAction}. They are never
 * created, edited, or deleted from the panel.
 */
class KioskPairingCodeResource extends Resource
{
    protected static ?string $model = KioskPairingCode::class;

    protected static ?string $navigationIcon = 'heroicon-o-key';

    protected static ?string $navigationGroup = 'Operatsiyalar';

    protected static ?string $navigationLabel = 'Pairing kodlar';

    protected static ?string $modelLabel = 'Pairing kod';

    protected static ?string $pluralModelLabel = 'Pairing kodlar';

    protected static ?int $navigationSort = 6;

    public static function form(Form $form): Form
    {
        // Read-only resource — schema only used for the View page.
        return $form->schema([
            Forms\Components\Placeholder::make('readonly_notice')
                ->label('')
                ->content(
                    "Pairing kodlar audit log sifatida saqlanadi. Yangi kod "
                    . 'yaratish uchun "Kiosklar" bo\'limidagi qurilmani oching.',
                ),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
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
            'index' => Pages\ListKioskPairingCodes::route('/'),
            'view' => Pages\ViewKioskPairingCode::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['device', 'createdBy']);
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
            Tables\Columns\TextColumn::make('code')
                ->label('Kod')
                ->state(fn (KioskPairingCode $record): string => self::renderCode($record))
                ->fontFamily('mono')
                ->copyable()
                ->copyableState(fn (KioskPairingCode $record): ?string => $record->consumed_at === null
                    ? $record->code
                    : null)
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('device.name')
                ->label('Qurilma')
                ->placeholder('—')
                ->searchable(['name']),
            Tables\Columns\TextColumn::make('createdBy.name')
                ->label('Tomonidan')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\IconColumn::make('consumed_at')
                ->label('Foydalanilgan')
                ->state(fn (KioskPairingCode $record): bool => $record->consumed_at !== null)
                ->boolean()
                ->trueIcon('heroicon-o-check-circle')
                ->falseIcon('heroicon-o-clock')
                ->trueColor('success')
                ->falseColor('warning'),
            Tables\Columns\TextColumn::make('consumed_at')
                ->label('Foydalanilgan vaqti')
                ->dateTime('d.m.Y H:i')
                ->placeholder('—')
                ->sortable()
                ->toggleable(),
            Tables\Columns\TextColumn::make('expires_at')
                ->label('Muddati tugaydi')
                ->dateTime('d.m.Y H:i')
                ->description(fn (KioskPairingCode $record): string => $record->expires_at->diffForHumans())
                ->sortable(),
            Tables\Columns\TextColumn::make('created_at')
                ->label('Yaratilgan')
                ->dateTime('d.m.Y H:i')
                ->since()
                ->sortable(),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\TernaryFilter::make('consumed')
                ->label('Foydalanilgan')
                ->placeholder('Hammasi')
                ->trueLabel('Faqat foydalanilgan')
                ->falseLabel('Faqat foydalanilmagan')
                ->queries(
                    true: fn (Builder $q) => $q->whereNotNull('consumed_at'),
                    false: fn (Builder $q) => $q->whereNull('consumed_at'),
                    blank: fn (Builder $q) => $q,
                ),
            Tables\Filters\TernaryFilter::make('expired')
                ->label('Muddati')
                ->placeholder('Hammasi')
                ->trueLabel('Muddati tugagan')
                ->falseLabel('Hali amal qiladigan')
                ->queries(
                    true: fn (Builder $q) => $q->where('expires_at', '<=', now()),
                    false: fn (Builder $q) => $q->where('expires_at', '>', now()),
                    blank: fn (Builder $q) => $q,
                ),
            Tables\Filters\Filter::make('created_at')
                ->label('Yaratilgan davr')
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
                            fn (Builder $q, $date) => $q->whereDate('created_at', '>=', $date),
                        )
                        ->when(
                            $data['until'] ?? null,
                            fn (Builder $q, $date) => $q->whereDate('created_at', '<=', $date),
                        );
                }),
        ];
    }

    /**
     * Mask the code if already consumed. Active codes remain visible so an
     * admin can re-share them with a kiosk operator if the modal closed.
     */
    private static function renderCode(KioskPairingCode $record): string
    {
        if ($record->consumed_at !== null) {
            return '••••••';
        }
        if (strlen($record->code) === 6) {
            return substr($record->code, 0, 3) . ' ' . substr($record->code, 3, 3);
        }
        return $record->code;
    }
}
