<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Shared\Models\Country;
use App\Filament\Resources\CountryResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Country lookup table — super admin only.
 *
 * Tenant admins should never see this resource; it controls the global list
 * of supported markets (UZ / KZ / KG / TJ / RU at launch). Edits ripple into
 * the signup wizard, the marketing site's "where we operate" map, and the
 * tenant region selector.
 *
 * Edit gates:
 *   - Whole resource hidden from non-super-admins via `shouldRegisterNavigation`.
 *   - All write actions (create / edit / delete) further check `is_super_admin`.
 *   - The is_active toggle is exposed as a row action so a CSO can pause
 *     signups from a country in one click without opening the edit form.
 */
class CountryResource extends Resource
{
    protected static ?string $model = Country::class;

    protected static ?string $navigationIcon = 'heroicon-o-globe-asia-australia';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?int $navigationSort = 20;

    public static function getNavigationLabel(): string
    {
        return __('region.country.nav_label');
    }

    public static function getModelLabel(): string
    {
        return __('region.country.model_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('region.country.plural_label');
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
        // Countries are referenced by tenants — never hard-delete; toggle
        // is_active instead.
        return false;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make(__('region.country.section_basics'))
                ->schema([
                    Forms\Components\TextInput::make('code')
                        ->label(__('region.country.col_code'))
                        ->required()
                        ->maxLength(2)
                        ->minLength(2)
                        ->disabled(static fn ($record): bool => $record !== null)
                        ->helperText(__('region.country.col_code_help')),
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
                    Forms\Components\TextInput::make('name.kz')
                        ->label('Атауы (Қазақша)')
                        ->maxLength(80),
                ])
                ->columns(2),
            Forms\Components\Section::make(__('region.country.section_locale'))
                ->schema([
                    Forms\Components\Select::make('currency_code')
                        ->label(__('region.country.col_currency'))
                        ->relationship(
                            name: 'currency',
                            titleAttribute: 'code',
                        )
                        ->required()
                        ->searchable()
                        ->preload()
                        ->native(false),
                    Forms\Components\Select::make('default_locale')
                        ->label(__('region.country.col_default_locale'))
                        ->options([
                            'uz' => "O'zbekcha",
                            'ru' => 'Русский',
                            'en' => 'English',
                            'kz' => 'Қазақша',
                            'ky' => 'Кыргызча',
                            'tg' => 'Тоҷикӣ',
                        ])
                        ->required()
                        ->native(false),
                    Forms\Components\TextInput::make('phone_prefix')
                        ->label(__('region.country.col_phone_prefix'))
                        ->maxLength(4)
                        ->required()
                        ->placeholder('+998'),
                    Forms\Components\TextInput::make('timezone')
                        ->label(__('region.country.col_timezone'))
                        ->maxLength(64)
                        ->required()
                        ->placeholder('Asia/Tashkent'),
                ])
                ->columns(2),
            Forms\Components\Section::make(__('region.country.section_status'))
                ->schema([
                    Forms\Components\Toggle::make('is_active')
                        ->label(__('region.country.col_is_active'))
                        ->default(true),
                    Forms\Components\DatePicker::make('launched_at')
                        ->label(__('region.country.col_launched_at'))
                        ->helperText(__('region.country.col_launched_at_help')),
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
                    ->label(__('region.country.col_code'))
                    ->fontFamily('mono')
                    ->weight('semibold')
                    ->size('sm'),
                Tables\Columns\TextColumn::make('name')
                    ->label(__('region.country.col_name'))
                    ->formatStateUsing(static fn ($state, Country $record): string => $record->displayName())
                    ->searchable(),
                Tables\Columns\TextColumn::make('currency_code')
                    ->label(__('region.country.col_currency'))
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('default_locale')
                    ->label(__('region.country.col_default_locale'))
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('phone_prefix')
                    ->label(__('region.country.col_phone_prefix'))
                    ->fontFamily('mono')
                    ->size('sm'),
                Tables\Columns\TextColumn::make('timezone')
                    ->label(__('region.country.col_timezone'))
                    ->size('sm')
                    ->color('gray'),
                Tables\Columns\IconColumn::make('is_active')
                    ->label(__('region.country.col_is_active'))
                    ->boolean(),
                Tables\Columns\TextColumn::make('launched_at')
                    ->label(__('region.country.col_launched_at'))
                    ->date('d.m.Y')
                    ->placeholder('—')
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label(__('region.country.col_is_active')),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->visible(fn (): bool => self::isCurrentUserSuperAdmin()),
                Tables\Actions\Action::make('toggle_active')
                    ->label(static fn (Country $r): string => $r->is_active
                        ? __('region.country.actions.disable')
                        : __('region.country.actions.enable'))
                    ->icon(static fn (Country $r): string => $r->is_active
                        ? 'heroicon-o-no-symbol'
                        : 'heroicon-o-check-circle')
                    ->color(static fn (Country $r): string => $r->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->visible(fn (): bool => self::isCurrentUserSuperAdmin())
                    ->action(static function (Country $record): void {
                        $record->is_active = ! $record->is_active;
                        $record->save();
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCountries::route('/'),
            'create' => Pages\CreateCountry::route('/create'),
            'edit' => Pages\EditCountry::route('/{record}/edit'),
        ];
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
