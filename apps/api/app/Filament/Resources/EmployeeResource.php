<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Employee;
use App\Filament\Resources\EmployeeResource\Pages;
use Filament\Forms;
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

    protected static ?string $navigationGroup = 'Xodimlar';

    protected static ?string $modelLabel = 'Xodim';

    protected static ?string $pluralModelLabel = 'Xodimlar';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Foydalanuvchi ma\'lumotlari')
                ->schema([
                    Forms\Components\TextInput::make('user_data.name')
                        ->label('Ism')
                        ->required()
                        ->maxLength(128),
                    Forms\Components\TextInput::make('user_data.email')
                        ->label('Email')
                        ->email()
                        ->required()
                        ->maxLength(128),
                    Forms\Components\TextInput::make('user_data.phone')
                        ->label('Telefon')
                        ->tel()
                        ->maxLength(32),
                    Forms\Components\TextInput::make('user_data.password')
                        ->label('Parol')
                        ->password()
                        ->revealable()
                        ->minLength(8)
                        ->maxLength(128)
                        ->required(fn (string $operation): bool => $operation === 'create')
                        ->visible(fn (string $operation): bool => $operation === 'create')
                        ->helperText('Faqat yaratishda talab qilinadi'),
                ])
                ->columns(2),

            Forms\Components\Section::make('Ish ma\'lumotlari')
                ->schema([
                    Forms\Components\TextInput::make('employee_code')
                        ->label('Xodim kodi')
                        ->maxLength(32)
                        ->placeholder('Avtomatik generatsiya: EMP-0001')
                        ->helperText('Bo\'sh qoldirsangiz avtomatik tuziladi'),
                    Forms\Components\Select::make('position')
                        ->label('Lavozim')
                        ->required()
                        ->options(collect(Role::cases())
                            ->filter(fn (Role $r): bool => ! in_array($r, [Role::SuperAdmin, Role::Customer], true))
                            ->mapWithKeys(fn (Role $r) => [$r->value => $r->label()])
                            ->toArray()),
                    Forms\Components\DatePicker::make('hire_date')
                        ->label('Ish boshlagan sana')
                        ->required()
                        ->native(false)
                        ->default(now()),
                    Forms\Components\Select::make('status')
                        ->label('Holati')
                        ->options(collect(EmployeeStatus::cases())
                            ->mapWithKeys(fn (EmployeeStatus $s) => [$s->value => $s->label()])
                            ->toArray())
                        ->default(EmployeeStatus::Active->value)
                        ->required(),
                    Forms\Components\TextInput::make('base_salary')
                        ->label('Asosiy oylik (so\'m)')
                        ->numeric()
                        ->minValue(0)
                        ->step(1000),
                    Forms\Components\TextInput::make('hourly_rate')
                        ->label('Soatbay stavka (so\'m)')
                        ->numeric()
                        ->minValue(0)
                        ->step(1000),
                    Forms\Components\TextInput::make('emergency_contact')
                        ->label('Favqulodda aloqa')
                        ->maxLength(128),
                    Forms\Components\Textarea::make('notes')
                        ->label('Izoh')
                        ->maxLength(2000)
                        ->rows(2)
                        ->columnSpanFull(),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Ism')
                    ->searchable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('employee_code')
                    ->label('Kod')
                    ->searchable()
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('position')
                    ->label('Lavozim')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => Role::tryFrom($state)?->label() ?? $state)
                    ->color('primary'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => EmployeeStatus::tryFrom($state)?->label() ?? $state)
                    ->color(fn (string $state): string => EmployeeStatus::tryFrom($state)?->color() ?? 'gray'),
                Tables\Columns\TextColumn::make('hire_date')
                    ->label('Ishga kirgan')
                    ->date('d.m.Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('current_shift_status')
                    ->label('Joriy smena')
                    ->state(fn (Employee $record): string => self::currentShiftLabel($record))
                    ->badge()
                    ->color(fn (Employee $record): string => self::currentShiftColor($record)),
                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->searchable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(EmployeeStatus::cases())
                        ->mapWithKeys(fn (EmployeeStatus $s) => [$s->value => $s->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('position')
                    ->label('Lavozim')
                    ->options(collect(Role::cases())
                        ->filter(fn (Role $r): bool => ! in_array($r, [Role::SuperAdmin, Role::Customer], true))
                        ->mapWithKeys(fn (Role $r) => [$r->value => $r->label()])
                        ->toArray()),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('terminate')
                        ->label('Ishdan bo\'shatish')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->action(function ($records): void {
                            foreach ($records as $employee) {
                                /** @var Employee $employee */
                                $employee->update([
                                    'status' => EmployeeStatus::Terminated->value,
                                    'terminated_at' => now(),
                                ]);
                            }
                        }),
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEmployees::route('/'),
            'create' => Pages\CreateEmployee::route('/create'),
            'edit' => Pages\EditEmployee::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['user'])
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
                'tenant',
            ]);
    }

    private static function currentShiftLabel(Employee $employee): string
    {
        $shift = $employee->shifts()
            ->where('status', ShiftStatus::Open->value)
            ->orderByDesc('actual_start')
            ->first();
        if ($shift !== null) {
            return ShiftStatus::Open->label();
        }
        $upcoming = $employee->shifts()
            ->where('status', ShiftStatus::Scheduled->value)
            ->where('scheduled_start', '>=', Carbon::now()->subHours(1))
            ->orderBy('scheduled_start')
            ->first();
        if ($upcoming !== null) {
            return ShiftStatus::Scheduled->label();
        }
        return '—';
    }

    private static function currentShiftColor(Employee $employee): string
    {
        $open = $employee->shifts()
            ->where('status', ShiftStatus::Open->value)
            ->exists();
        return $open ? 'success' : 'gray';
    }
}
