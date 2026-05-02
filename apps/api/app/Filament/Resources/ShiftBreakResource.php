<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Employee\Enums\BreakReason;
use App\Domain\Employee\Models\ShiftBreak;
use App\Filament\Resources\ShiftBreakResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ShiftBreakResource extends Resource
{
    protected static ?string $model = ShiftBreak::class;

    protected static ?string $navigationIcon = 'heroicon-o-pause-circle';

    protected static ?string $navigationGroup = 'HR';

    protected static ?string $modelLabel = 'Tanaffus';

    protected static ?string $pluralModelLabel = 'Tanaffuslar';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Tanaffus')
                ->schema([
                    Forms\Components\Placeholder::make('employee')
                        ->label('Xodim')
                        ->content(fn (?ShiftBreak $record): string => $record?->employee?->user?->name ?? '—'),
                    Forms\Components\Placeholder::make('shift_started')
                        ->label('Smena rejasi')
                        ->content(fn (?ShiftBreak $record): string => $record?->shift?->scheduled_start?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('started_at')
                        ->label('Boshlandi')
                        ->content(fn (?ShiftBreak $record): string => $record?->started_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('ended_at')
                        ->label('Tugadi')
                        ->content(fn (?ShiftBreak $record): string => $record?->ended_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('duration_minutes')
                        ->label('Davomiyligi')
                        ->content(fn (?ShiftBreak $record): string => $record?->duration_minutes !== null
                            ? $record->duration_minutes . 'm'
                            : '—'),
                    Forms\Components\Placeholder::make('reason')
                        ->label('Sababi')
                        ->content(fn (?ShiftBreak $record): string => self::reasonLabel($record?->reason)),
                    Forms\Components\Placeholder::make('notes')
                        ->label('Izoh')
                        ->content(fn (?ShiftBreak $record): string => $record?->notes ?? '—'),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('started_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('employee.user.name')
                    ->label('Xodim')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('employee.employee_code')
                    ->label('Kod')
                    ->badge()
                    ->color('gray')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('shift.scheduled_start')
                    ->label('Smena')
                    ->date('d.m.Y')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('started_at')
                    ->label('Boshlandi')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('ended_at')
                    ->label('Tugadi')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder("Davom etmoqda")
                    ->color(fn ($state): string => $state === null ? 'warning' : 'gray'),
                Tables\Columns\TextColumn::make('duration_minutes')
                    ->label('Davomiyligi')
                    ->formatStateUsing(fn (?int $state): string => $state !== null ? $state . 'm' : '—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('reason')
                    ->label('Sababi')
                    ->badge()
                    ->color(fn (?string $state): string => self::reasonColor($state))
                    ->formatStateUsing(fn (?string $state): string => self::reasonLabel($state)),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('employee_id')
                    ->label('Xodim')
                    ->relationship('employee', 'employee_code')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('reason')
                    ->label('Sababi')
                    ->options(collect(BreakReason::cases())
                        ->mapWithKeys(fn (BreakReason $r) => [$r->value => $r->label()])
                        ->toArray()),
                Tables\Filters\Filter::make('started_at')
                    ->label('Sana oralig\'i')
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
                            ->when($data['from'] ?? null,
                                fn (Builder $q, $date) => $q->whereDate('started_at', '>=', $date))
                            ->when($data['until'] ?? null,
                                fn (Builder $q, $date) => $q->whereDate('started_at', '<=', $date));
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
            'index' => Pages\ListShiftBreaks::route('/'),
            'view' => Pages\ViewShiftBreak::route('/{record}'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['employee.user', 'shift']);
    }

    private static function reasonLabel(?string $reason): string
    {
        if ($reason === null) {
            return '—';
        }
        return BreakReason::tryFrom($reason)?->label() ?? $reason;
    }

    private static function reasonColor(?string $reason): string
    {
        $case = $reason !== null ? BreakReason::tryFrom($reason) : null;
        return match ($case) {
            BreakReason::Lunch => 'success',
            BreakReason::Rest => 'info',
            BreakReason::Personal => 'warning',
            default => 'gray',
        };
    }
}
