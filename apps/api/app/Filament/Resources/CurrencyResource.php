<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Shared\Models\Currency;
use App\Filament\Resources\CurrencyResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Currency lookup table — super admin only.
 *
 * `decimals` is the most-load-bearing column: changing it after-the-fact
 * silently changes how every order in that currency is rendered. Treat with
 * the same caution as a tax rate change.
 *
 * As with countries, deletion is disabled — toggling `is_active=false` is
 * the soft equivalent. Tenants holding rows in a deactivated currency keep
 * their data but cannot select it for new orders (filtered at the API layer).
 */
class CurrencyResource extends Resource
{
    protected static ?string $model = Currency::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?int $navigationSort = 21;

    public static function getNavigationLabel(): string
    {
        return __('region.currency.nav_label');
    }

    public static function getModelLabel(): string
    {
        return __('region.currency.model_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('region.currency.plural_label');
    }

    public static function shouldRegisterNavigation(): bool
    {
        return self::isCurrentUserSuperAdmin();
    }

    public static function canViewAny(): bool
    {
        return self::isCurrentUserSuperAdmin();
    }

    public static function canCreate(): bool
    {
        return self::isCurrentUserSuperAdmin();
    }

    public static function canEdit($record): bool
    {
        return self::isCurrentUserSuperAdmin();
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make(__('region.currency.section_basics'))
                ->schema([
                    Forms\Components\TextInput::make('code')
                        ->label(__('region.currency.col_code'))
                        ->required()
                        ->maxLength(3)
                        ->minLength(3)
                        ->disabled(static fn ($record): bool => $record !== null)
                        ->helperText(__('region.currency.col_code_help')),
                    Forms\Components\TextInput::make('symbol')
                        ->label(__('region.currency.col_symbol'))
                        ->required()
                        ->maxLength(8),
                    Forms\Components\TextInput::make('name.uz')
                        ->label("Nomi (O'zbekcha)")
                        ->maxLength(80),
                    Forms\Components\TextInput::make('name.ru')
                        ->label('Название (Русский)')
                        ->maxLength(80),
                    Forms\Components\TextInput::make('name.en')
                        ->label('Name (English)')
                        ->maxLength(80)
                        ->required(),
                ])
                ->columns(2),
            Forms\Components\Section::make(__('region.currency.section_format'))
                ->description(__('region.currency.section_format_help'))
                ->schema([
                    Forms\Components\TextInput::make('decimals')
                        ->label(__('region.currency.col_decimals'))
                        ->numeric()
                        ->minValue(0)
                        ->maxValue(4)
                        ->default(2)
                        ->required()
                        ->helperText(__('region.currency.col_decimals_help')),
                    Forms\Components\Toggle::make('is_active')
                        ->label(__('region.currency.col_is_active'))
                        ->default(true),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('code')
            ->columns([
                Tables\Columns\TextColumn::make('code')
                    ->label(__('region.currency.col_code'))
                    ->fontFamily('mono')
                    ->weight('semibold')
                    ->size('sm'),
                Tables\Columns\TextColumn::make('name')
                    ->label(__('region.currency.col_name'))
                    ->formatStateUsing(static fn ($state, Currency $record): string => $record->nameFor(app()->getLocale()))
                    ->searchable(),
                Tables\Columns\TextColumn::make('symbol')
                    ->label(__('region.currency.col_symbol'))
                    ->fontFamily('mono')
                    ->color('gray'),
                Tables\Columns\TextColumn::make('decimals')
                    ->label(__('region.currency.col_decimals'))
                    ->badge()
                    ->color(static fn (int $state): string => $state === 0 ? 'warning' : 'success'),
                Tables\Columns\IconColumn::make('is_active')
                    ->label(__('region.currency.col_is_active'))
                    ->boolean(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label(__('region.currency.col_is_active')),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->visible(fn (): bool => self::isCurrentUserSuperAdmin()),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCurrencies::route('/'),
            'create' => Pages\CreateCurrency::route('/create'),
            'edit' => Pages\EditCurrency::route('/{record}/edit'),
        ];
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
