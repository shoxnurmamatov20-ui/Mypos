<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Shared\Models\Country;
use App\Domain\Shared\Models\Currency;
use App\Domain\Tenant\Enums\TenantPlan;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Filament\Resources\TenantResource\Pages;
use App\Filament\Resources\TenantResource\RelationManagers\UsersRelationManager;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Forms\Set;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Schema;

class TenantResource extends Resource
{
    protected static ?string $model = Tenant::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?string $modelLabel = 'Restoran';

    protected static ?string $pluralModelLabel = 'Restoranlar';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Asosiy ma\'lumotlar')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Nomi')
                        ->required()
                        ->maxLength(128),
                    Forms\Components\TextInput::make('slug')
                        ->label('Slug')
                        ->required()
                        ->maxLength(64)
                        ->unique(ignoreRecord: true)
                        ->regex('/^[a-z0-9-]+$/')
                        ->helperText('URL uchun: faqat kichik harflar, raqamlar va tire'),
                    Forms\Components\TextInput::make('legal_name')
                        ->label('Huquqiy nomi')
                        ->maxLength(256),
                    Forms\Components\TextInput::make('phone')
                        ->label('Telefon')
                        ->tel()
                        ->maxLength(32),
                    Forms\Components\TextInput::make('email')
                        ->label('Email')
                        ->email()
                        ->maxLength(128),
                    Forms\Components\TextInput::make('logo_url')
                        ->label('Logo URL')
                        ->url()
                        ->maxLength(512),
                ])
                ->columns(2),

            Forms\Components\Section::make('Obuna va holat')
                ->schema([
                    Forms\Components\Select::make('plan')
                        ->label('Tarif')
                        ->options(collect(TenantPlan::cases())
                            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                            ->toArray())
                        ->required()
                        ->default(TenantPlan::Free->value),
                    Forms\Components\Select::make('status')
                        ->label('Holati')
                        ->options(collect(TenantStatus::cases())
                            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                            ->toArray())
                        ->required()
                        ->default(TenantStatus::Trialing->value),
                    Forms\Components\DateTimePicker::make('trial_ends_at')
                        ->label('Sinov muddati tugashi'),
                    Forms\Components\DateTimePicker::make('suspended_at')
                        ->label('To\'xtatilgan sana'),
                ])
                ->columns(2),

            Forms\Components\Section::make('Mahalliy sozlamalar')
                ->schema([
                    Forms\Components\Select::make('default_locale')
                        ->label('Asosiy til')
                        ->options([
                            'uz' => "O'zbekcha",
                            'ru' => 'Русский',
                            'en' => 'English',
                        ])
                        ->required()
                        ->default('uz'),
                    Forms\Components\Select::make('default_currency')
                        ->label('Valyuta')
                        ->options([
                            'UZS' => 'UZS',
                            'USD' => 'USD',
                            'EUR' => 'EUR',
                            'RUB' => 'RUB',
                            'KZT' => 'KZT',
                        ])
                        ->required()
                        ->default('UZS'),
                    Forms\Components\TextInput::make('timezone')
                        ->label('Vaqt mintaqasi')
                        ->required()
                        ->maxLength(64)
                        ->default('Asia/Tashkent'),
                ])
                ->columns(3),

            // Phase 4 — Region (country/currency FKs). The legacy
            // default_locale + default_currency columns above remain for
            // backwards compatibility; new code reads from these normalized
            // FK columns instead. When `country_code` changes, we suggest
            // the country's default currency + locale via Livewire reactive
            // `afterStateUpdated`.
            Forms\Components\Section::make(__('region.tenant.section_title'))
                ->description(__('region.tenant.section_description'))
                // Hidden until the region migration has applied — keeps the
                // form usable on fresh installs without surfacing a column
                // that doesn't exist yet.
                ->visible(static fn (): bool => Schema::hasColumn('tenants', 'country_code'))
                ->schema([
                    Forms\Components\Select::make('country_code')
                        ->label(__('region.tenant.col_country'))
                        ->options(static function (): array {
                            return Country::query()
                                ->where('is_active', true)
                                ->orderBy('code')
                                ->get()
                                ->mapWithKeys(static fn (Country $c): array => [
                                    $c->code => $c->displayName(),
                                ])
                                ->all();
                        })
                        ->live()
                        ->native(false)
                        ->searchable()
                        ->afterStateUpdated(static function (Set $set, Get $get, ?string $state): void {
                            if ($state === null) {
                                return;
                            }
                            $country = Country::query()->find($state);
                            if ($country === null) {
                                return;
                            }
                            // Suggest currency + locale only when those fields
                            // are still empty / pristine — never overwrite an
                            // explicit user choice.
                            if (empty($get('currency_code'))) {
                                $set('currency_code', $country->currency_code);
                            }
                            if (empty($get('default_locale'))) {
                                $set('default_locale', $country->default_locale);
                            }
                            if (empty($get('timezone'))) {
                                $set('timezone', $country->timezone);
                            }
                        }),
                    Forms\Components\Select::make('currency_code')
                        ->label(__('region.tenant.col_currency'))
                        ->options(static function (): array {
                            return Currency::query()
                                ->where('is_active', true)
                                ->orderBy('code')
                                ->pluck('code', 'code')
                                ->all();
                        })
                        ->native(false)
                        ->searchable(),
                ])
                ->columns(2),

            Forms\Components\Section::make('Sozlamalar va funksiyalar')
                ->schema([
                    Forms\Components\KeyValue::make('settings')
                        ->label('Sozlamalar (JSON)'),
                    Forms\Components\KeyValue::make('feature_flags')
                        ->label('Feature Flags'),
                ])
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nomi')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('slug')
                    ->label('Slug')
                    ->searchable()
                    ->color('gray')
                    ->size('sm'),
                Tables\Columns\TextColumn::make('plan')
                    ->label('Tarif')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'enterprise' => 'warning',
                        'business' => 'info',
                        'pro' => 'success',
                        'starter' => 'primary',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'trialing' => 'warning',
                        'suspended' => 'danger',
                        'cancelled' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('default_locale')
                    ->label('Til')
                    ->color('gray'),
                Tables\Columns\TextColumn::make('users_count')
                    // Filament's per-column `->counts()` issues a separate
                    // sub-query per visible column. We hoist the count(s) to
                    // `getEloquentQuery()` via `withCount` so the engine emits
                    // a single SELECT with correlated subqueries — see audit H1.
                    ->label('Xodimlar')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('plan')
                    ->label('Tarif')
                    ->options(collect(TenantPlan::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(TenantStatus::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            UsersRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenants::route('/'),
            'create' => Pages\CreateTenant::route('/create'),
            'edit' => Pages\EditTenant::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        // Audit H1: hoist `users_count` (and reserve room for `orders_count`)
        // up to the parent query so we emit one SELECT instead of one per
        // visible column on every row.
        return parent::getEloquentQuery()
            ->withCount(['users'])
            ->withoutGlobalScopes([
                \Illuminate\Database\Eloquent\SoftDeletingScope::class,
            ]);
    }
}
