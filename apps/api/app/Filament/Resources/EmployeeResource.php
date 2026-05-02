<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Filament\Resources\EmployeeResource\Pages;
use App\Filament\Resources\EmployeeResource\Schemas\EmployeeActions;
use App\Filament\Resources\EmployeeResource\Schemas\EmployeeFormSchema;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Carbon;

class EmployeeResource extends Resource
{
    protected static ?string $model = Employee::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationGroup = 'HR';

    protected static ?string $modelLabel = 'Xodim';

    protected static ?string $pluralModelLabel = 'Xodimlar';

    protected static ?int $navigationSort = 1;

    /** @var array<int, string> */
    protected static array $globalSearchAttributes = [
        'employee_code',
        'user.name',
        'user.phone',
    ];

    /** @return array<int, string> */
    public static function getGloballySearchableAttributes(): array
    {
        return self::$globalSearchAttributes;
    }

    public static function form(Form $form): Form
    {
        return $form->schema(EmployeeFormSchema::sections());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions(EmployeeActions::rowActions())
            ->bulkActions(EmployeeActions::bulkActions());
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEmployees::route('/'),
            'create' => Pages\CreateEmployee::route('/create'),
            'view' => Pages\ViewEmployee::route('/{record}'),
            'edit' => Pages\EditEmployee::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        // Eager-load relations needed to render every row of the table. Without
        // this, the `current_shift_status` column triggers up to three extra
        // queries per row (open shift × 2 + open break) — see audit P3.
        //
        // We constrain the `shifts` eager-load to rows that the row-level
        // helpers below actually inspect:
        //   - status = open  (currently clocked-in shift)
        //   - status = scheduled AND scheduled_start within the last hour
        //     up to today's end (shifts about to start)
        // and we eager-load any open break for those shifts so the badge can
        // show "Tanaffusda (Nm)" without another query.
        return parent::getEloquentQuery()
            ->with([
                'user',
                'shifts' => function ($query): void {
                    $query
                        ->where(function ($q): void {
                            $q->where('status', ShiftStatus::Open->value)
                                ->orWhere(function ($q2): void {
                                    $q2->where('status', ShiftStatus::Scheduled->value)
                                        ->where('scheduled_start', '>=', Carbon::now()->subHour())
                                        ->where('scheduled_start', '<=', Carbon::now()->endOfDay());
                                });
                        })
                        ->orderByRaw("CASE status WHEN 'open' THEN 0 ELSE 1 END")
                        ->orderByDesc('actual_start')
                        ->orderBy('scheduled_start')
                        ->with([
                            'breaks' => function ($q): void {
                                $q->whereNull('ended_at')->orderByDesc('started_at');
                            },
                        ]);
                },
            ])
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('user.name')
                ->label('Ism')
                ->searchable()
                ->sortable()
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('employee_code')
                ->label('Kod')
                ->searchable()
                ->sortable()
                ->badge()
                ->color('gray'),
            Tables\Columns\TextColumn::make('position')
                ->label('Lavozim')
                ->badge()
                ->formatStateUsing(fn (string $state): string => EmployeeRole::tryFrom($state)?->label()
                    ?? Role::tryFrom($state)?->label()
                    ?? $state)
                ->color(fn (string $state): string => EmployeeFormSchema::positionColor($state)),
            Tables\Columns\TextColumn::make('user.phone')
                ->label('Telefon')
                ->copyable()
                ->placeholder('—'),
            Tables\Columns\TextColumn::make('status')
                ->label('Holati')
                ->badge()
                ->formatStateUsing(fn (string $state): string => EmployeeStatus::tryFrom($state)?->label() ?? $state)
                ->color(fn (string $state): string => EmployeeStatus::tryFrom($state)?->color() ?? 'gray'),
            Tables\Columns\TextColumn::make('last_clock_in_at')
                ->label('Oxirgi ish kuni')
                ->since()
                ->placeholder('—')
                ->sortable()
                ->toggleable(),
            Tables\Columns\TextColumn::make('hire_date')
                ->label('Ishga kirgan')
                ->date('d.m.Y')
                ->sortable(),
            Tables\Columns\TextColumn::make('current_shift_status')
                ->label('Joriy smena')
                ->state(fn (Employee $record): string => self::currentShiftLabel($record))
                ->badge()
                ->color(fn (Employee $record): string => self::currentShiftColor($record))
                ->toggleable(),
            Tables\Columns\IconColumn::make('pin_code_hash')
                ->label('PIN')
                ->state(fn (Employee $record): bool => $record->pin_code_hash !== null)
                ->boolean()
                ->trueIcon('heroicon-o-lock-closed')
                ->falseIcon('heroicon-o-lock-open')
                ->trueColor('success')
                ->falseColor('gray')
                ->toggleable(),
            Tables\Columns\TextColumn::make('user.email')
                ->label('Email')
                ->toggleable(isToggledHiddenByDefault: true)
                ->searchable(),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('status')
                ->label('Holati')
                ->options(collect(EmployeeStatus::cases())
                    ->mapWithKeys(fn (EmployeeStatus $s) => [$s->value => $s->label()])
                    ->toArray()),
            Tables\Filters\SelectFilter::make('position')
                ->label('Lavozim')
                ->options(EmployeeFormSchema::positionOptions()),
            Tables\Filters\TernaryFilter::make('is_active')
                ->label('Faqat faollar')
                ->placeholder('Hammasi')
                ->trueLabel('Faqat faol')
                ->falseLabel('Faqat nofaol')
                ->queries(
                    true: fn (Builder $q) => $q->where('status', EmployeeStatus::Active->value)
                        ->whereNull('terminated_at'),
                    false: fn (Builder $q) => $q->where(function (Builder $b): void {
                        $b->where('status', '!=', EmployeeStatus::Active->value)
                            ->orWhereNotNull('terminated_at');
                    }),
                    blank: fn (Builder $q) => $q,
                ),
            Tables\Filters\TrashedFilter::make(),
        ];
    }

    /**
     * Read the (already eager-loaded) `shifts` collection — see
     * {@see self::getEloquentQuery()}. Returns the first matching status,
     * preferring an open shift over an upcoming scheduled one.
     */
    private static function currentShiftLabel(Employee $employee): string
    {
        $shift = self::firstLoadedShift($employee, ShiftStatus::Open);
        if ($shift !== null) {
            return ShiftStatus::Open->label();
        }
        $upcoming = self::firstLoadedShift($employee, ShiftStatus::Scheduled);
        if ($upcoming !== null) {
            return ShiftStatus::Scheduled->label();
        }
        return '—';
    }

    private static function currentShiftColor(Employee $employee): string
    {
        return self::firstLoadedShift($employee, ShiftStatus::Open) !== null
            ? 'success'
            : 'gray';
    }

    /**
     * Pull a shift out of the pre-loaded `shifts` relation by status.
     * Falls back to a single direct query if the relation wasn't loaded
     * (e.g. when called from a context that bypasses getEloquentQuery()).
     */
    private static function firstLoadedShift(Employee $employee, ShiftStatus $status): ?Shift
    {
        if (! $employee->relationLoaded('shifts')) {
            return $employee->shifts()
                ->where('status', $status->value)
                ->orderByDesc('actual_start')
                ->first();
        }
        return $employee->shifts->firstWhere('status', $status->value);
    }
}
