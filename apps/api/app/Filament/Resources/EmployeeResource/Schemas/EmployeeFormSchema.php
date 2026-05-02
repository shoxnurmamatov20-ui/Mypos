<?php

declare(strict_types=1);

namespace App\Filament\Resources\EmployeeResource\Schemas;

use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use Filament\Forms;

/**
 * Form schema sections for the EmployeeResource.
 *
 * Splitting these out keeps the Resource class under our 400-line limit
 * and groups related UI logic.
 */
final class EmployeeFormSchema
{
    /** @return array<int, Forms\Components\Component> */
    public static function sections(): array
    {
        return [
            self::userAccountSection(),
            self::employmentSection(),
            self::pinCodeSection(),
        ];
    }

    public static function userAccountSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make("Foydalanuvchi ma'lumotlari")
            ->description('Xodim uchun yangi user account hosil qilinadi')
            ->schema([
                Forms\Components\TextInput::make('user_data.name')
                    ->label('Ism')
                    ->required()
                    ->maxLength(128),
                Forms\Components\TextInput::make('user_data.phone')
                    ->label('Telefon')
                    ->tel()
                    ->required(fn (string $operation): bool => $operation === 'create')
                    ->maxLength(32)
                    ->unique(
                        table: 'users',
                        column: 'phone',
                        ignorable: fn ($record) => $record?->user
                    ),
                Forms\Components\TextInput::make('user_data.email')
                    ->label('Email')
                    ->email()
                    ->maxLength(128)
                    ->unique(
                        table: 'users',
                        column: 'email',
                        ignorable: fn ($record) => $record?->user
                    ),
                Forms\Components\Select::make('user_data.locale')
                    ->label('Til')
                    ->options([
                        'uz' => "O'zbekcha",
                        'ru' => 'Русский',
                        'en' => 'English',
                    ])
                    ->default('uz'),
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
            ->columns(2);
    }

    public static function employmentSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make("Ish ma'lumotlari")
            ->schema([
                Forms\Components\TextInput::make('employee_code')
                    ->label('Xodim kodi')
                    ->maxLength(32)
                    ->placeholder('Avtomatik: EMP-0001')
                    ->helperText("Bo'sh qoldirsangiz avtomatik tuziladi"),
                Forms\Components\Select::make('position')
                    ->label('Lavozim')
                    ->required()
                    ->options(self::positionOptions()),
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
                    ->label("Asosiy oylik (so'm)")
                    ->numeric()
                    ->minValue(0)
                    ->step(1000)
                    ->suffix("so'm"),
                Forms\Components\TextInput::make('hourly_rate')
                    ->label("Soatbay stavka (so'm)")
                    ->numeric()
                    ->minValue(0)
                    ->step(1000)
                    ->suffix("so'm"),
                Forms\Components\TextInput::make('emergency_contact')
                    ->label('Favqulodda aloqa')
                    ->maxLength(128),
                Forms\Components\Textarea::make('notes')
                    ->label('Izoh')
                    ->maxLength(2000)
                    ->rows(2)
                    ->columnSpanFull(),
            ])
            ->columns(2);
    }

    public static function pinCodeSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make('PIN kod')
            ->description('Xodim mobil ilovaga kirishda ushbu PIN-kodini kiritadi')
            ->visibleOn('edit')
            ->schema([
                Forms\Components\Placeholder::make('pin_status')
                    ->label('Holati')
                    ->content(function (?Employee $record): string {
                        if ($record === null) {
                            return '—';
                        }
                        if ($record->pin_code_hash === null) {
                            return "PIN o'rnatilmagan";
                        }
                        $when = $record->pin_set_at?->translatedFormat('d.m.Y H:i') ?? '—';
                        return "PIN o'rnatilgan ({$when})";
                    }),
                Forms\Components\Placeholder::make('pin_action_help')
                    ->label('')
                    ->content("PIN-kodni qayta o'rnatish uchun yuqoridagi 'PIN-ni almashtirish' tugmasidan foydalaning."),
            ])
            ->columns(1);
    }

    /** @return array<string, string> */
    public static function positionOptions(): array
    {
        return collect(EmployeeRole::cases())
            ->mapWithKeys(fn (EmployeeRole $r) => [$r->value => $r->label()])
            ->toArray();
    }

    public static function positionColor(string $position): string
    {
        return match ($position) {
            EmployeeRole::Waiter->value => 'primary',
            EmployeeRole::Cook->value, 'chef' => 'warning',
            EmployeeRole::Cashier->value => 'info',
            EmployeeRole::Manager->value => 'success',
            EmployeeRole::Admin->value, 'owner' => 'danger',
            EmployeeRole::Courier->value => 'info',
            default => 'gray',
        };
    }
}
