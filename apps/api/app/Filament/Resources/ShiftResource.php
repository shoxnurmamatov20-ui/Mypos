<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Filament\Resources\ShiftResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ShiftResource extends Resource
{
    protected static ?string $model = Shift::class;

    protected static ?string $navigationIcon = 'heroicon-o-clock';

    protected static ?string $navigationGroup = 'HR';

    protected static ?string $modelLabel = 'Smena';

    protected static ?string $pluralModelLabel = 'Smenalar';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Smena')
                ->schema([
                    Forms\Components\Select::make('employee_id')
                        ->label('Xodim')
                        ->relationship('employee', 'employee_code')
                        ->getOptionLabelFromRecordUsing(
                            fn (Employee $record): string => trim(
                                ($record->user?->name ?? 'No name') . ' (' . $record->employee_code . ')'
                            )
                        )
                        ->searchable(['employee_code'])
                        ->preload()
                        ->required(),
                    Forms\Components\Select::make('status')
                        ->label('Holati')
                        ->options(collect(ShiftStatus::cases())
                            ->mapWithKeys(fn (ShiftStatus $s) => [$s->value => $s->label()])
                            ->toArray())
                        ->default(ShiftStatus::Scheduled->value)
                        ->required(),
                ])
                ->columns(2),

            Forms\Components\Section::make('Vaqtlar')
                ->schema([
                    Forms\Components\DateTimePicker::make('scheduled_start')
                        ->label('Rejalashtirilgan boshlash')
                        ->required()
                        ->seconds(false)
                        ->native(false),
                    Forms\Components\DateTimePicker::make('scheduled_end')
                        ->label('Rejalashtirilgan tugash')
                        ->required()
                        ->seconds(false)
                        ->native(false)
                        ->after('scheduled_start'),
                    Forms\Components\DateTimePicker::make('actual_start')
                        ->label('Haqiqiy boshlash')
                        ->seconds(false)
                        ->native(false)
                        ->disabled(fn (string $operation): bool => $operation === 'create')
                        ->helperText('Faqat tahrirlashda mavjud'),
                    Forms\Components\DateTimePicker::make('actual_end')
                        ->label('Haqiqiy tugash')
                        ->seconds(false)
                        ->native(false)
                        ->disabled(fn (string $operation): bool => $operation === 'create')
                        ->helperText('Faqat tahrirlashda mavjud'),
                ])
                ->columns(2),

            Forms\Components\Section::make("Qo'shimcha")
                ->schema([
                    Forms\Components\Textarea::make('notes')
                        ->label('Izoh')
                        ->maxLength(1000)
                        ->rows(3),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('scheduled_start', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListShifts::route('/'),
            'create' => Pages\CreateShift::route('/create'),
            'view' => Pages\ViewShift::route('/{record}'),
            'edit' => Pages\EditShift::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['employee.user']);
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('employee.user.name')
                ->label('Xodim')
                ->searchable()
                ->sortable()
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('employee.position')
                ->label('Lavozim')
                ->badge()
                ->formatStateUsing(fn (?string $state): string => $state !== null
                    ? (EmployeeRole::tryFrom($state)?->label()
                        ?? Role::tryFrom($state)?->label()
                        ?? $state)
                    : '—'
                )
                ->color('primary'),
            Tables\Columns\TextColumn::make('scheduled_start')
                ->label('Rejada (boshlash)')
                ->dateTime('d.m.Y H:i')
                ->sortable(),
            Tables\Columns\TextColumn::make('scheduled_end')
                ->label('Rejada (tugash)')
                ->dateTime('d.m.Y H:i')
                ->sortable()
                ->toggleable(),
            Tables\Columns\TextColumn::make('actual_start')
                ->label('Boshlandi')
                ->dateTime('d.m.Y H:i')
                ->placeholder('—')
                ->color(fn ($state): string => $state !== null ? 'success' : 'gray')
                ->sortable(),
            Tables\Columns\TextColumn::make('actual_end')
                ->label('Tugadi')
                ->dateTime('d.m.Y H:i')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('worked_minutes')
                ->label('Ishlangan vaqt')
                ->state(fn (Shift $record): string => self::formatWorkedTime($record))
                ->placeholder('—'),
            Tables\Columns\TextColumn::make('status')
                ->label('Holati')
                ->badge()
                ->formatStateUsing(fn (string $state): string => ShiftStatus::tryFrom($state)?->label() ?? $state)
                ->color(fn (string $state): string => ShiftStatus::tryFrom($state)?->color() ?? 'gray'),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('employee_id')
                ->label('Xodim')
                ->relationship('employee', 'employee_code')
                ->searchable()
                ->preload(),
            Tables\Filters\SelectFilter::make('status')
                ->label('Holati')
                ->options(collect(ShiftStatus::cases())
                    ->mapWithKeys(fn (ShiftStatus $s) => [$s->value => $s->label()])
                    ->toArray()),
            Tables\Filters\Filter::make('scheduled_start')
                ->label('Rejalashtirilgan davr')
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
                            fn (Builder $q, $date) => $q->whereDate('scheduled_start', '>=', $date))
                        ->when($data['until'] ?? null,
                            fn (Builder $q, $date) => $q->whereDate('scheduled_start', '<=', $date));
                }),
        ];
    }

    private static function formatWorkedTime(Shift $shift): string
    {
        if ($shift->actual_start === null) {
            return '—';
        }
        $end = $shift->actual_end ?? now();
        $minutes = max(0, (int) $shift->actual_start->diffInMinutes($end));
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;
        if ($hours === 0) {
            return $mins . 'm';
        }
        return $hours . 'h ' . $mins . 'm';
    }
}
