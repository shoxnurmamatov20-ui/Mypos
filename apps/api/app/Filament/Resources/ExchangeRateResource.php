<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Shared\Models\ExchangeRate;
use App\Filament\Resources\ExchangeRateResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Throwable;

/**
 * Exchange rate history — super admin only, mostly read.
 *
 * Append-only table. Rows are inserted by:
 *   - The daily {@see \App\Jobs\SyncFxRatesJob} cron (cbu / nbp / fixer)
 *   - The "Refresh now" header action on this resource
 *   - Manual super-admin overrides (rare — used when a provider is down)
 *
 * Editing existing rows is allowed but discouraged. We don't expose Delete —
 * historical rates are needed for accurate reporting and the unique constraint
 * on (from, to, date) prevents duplicates anyway.
 *
 * `getEloquentQuery()` strips the BelongsToTenant scope explicitly because the
 * model doesn't use it, but Filament still goes through `parent::getEloquentQuery()`
 * which can apply other discovered scopes — keeping the override is cheap insurance.
 */
class ExchangeRateResource extends Resource
{
    protected static ?string $model = ExchangeRate::class;

    protected static ?string $navigationIcon = 'heroicon-o-arrows-right-left';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?int $navigationSort = 22;

    public static function getNavigationLabel(): string
    {
        return __('region.fx.nav_label');
    }

    public static function getModelLabel(): string
    {
        return __('region.fx.model_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('region.fx.plural_label');
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

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form->schema([
            Forms\Components\Section::make(__('region.fx.section_basics'))
                ->schema([
                    Forms\Components\Select::make('from_currency')
                        ->label(__('region.fx.col_from'))
                        ->relationship('fromCurrency', 'code')
                        ->required()
                        ->searchable()
                        ->preload()
                        ->native(false),
                    Forms\Components\Select::make('to_currency')
                        ->label(__('region.fx.col_to'))
                        ->relationship('toCurrency', 'code')
                        ->required()
                        ->searchable()
                        ->preload()
                        ->native(false),
                    Forms\Components\TextInput::make('rate')
                        ->label(__('region.fx.col_rate'))
                        ->numeric()
                        ->step('0.00000001')
                        ->required()
                        ->helperText(__('region.fx.col_rate_help')),
                    Forms\Components\Select::make('source')
                        ->label(__('region.fx.col_source'))
                        ->options([
                            'cbu' => 'CBU (Markaziy bank)',
                            'nbp' => 'NBP (Tojikiston)',
                            'fixer' => 'Fixer.io',
                            'manual' => __('region.fx.source.manual'),
                        ])
                        ->default('manual')
                        ->required()
                        ->native(false),
                    Forms\Components\DatePicker::make('rate_date')
                        ->label(__('region.fx.col_rate_date'))
                        ->required(),
                    Forms\Components\DateTimePicker::make('fetched_at')
                        ->label(__('region.fx.col_fetched_at'))
                        ->default(now())
                        ->required(),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('rate_date', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('rate_date')
                    ->label(__('region.fx.col_rate_date'))
                    ->date('d.m.Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('from_currency')
                    ->label(__('region.fx.col_from'))
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('to_currency')
                    ->label(__('region.fx.col_to'))
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('rate')
                    ->label(__('region.fx.col_rate'))
                    ->formatStateUsing(static fn ($state, ExchangeRate $r): string => self::formatRate(
                        (float) $state,
                        (string) $r->to_currency,
                    ))
                    ->fontFamily('mono')
                    ->alignRight(),
                Tables\Columns\TextColumn::make('source')
                    ->label(__('region.fx.col_source'))
                    ->badge()
                    ->color(static fn (string $state): string => match ($state) {
                        'cbu', 'nbp' => 'success',
                        'fixer' => 'info',
                        'manual' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('fetched_at')
                    ->label(__('region.fx.col_fetched_at'))
                    ->dateTime('d.m.Y H:i')
                    ->since()
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('from_currency')
                    ->label(__('region.fx.col_from'))
                    ->relationship('fromCurrency', 'code'),
                Tables\Filters\SelectFilter::make('to_currency')
                    ->label(__('region.fx.col_to'))
                    ->relationship('toCurrency', 'code'),
                Tables\Filters\SelectFilter::make('source')
                    ->label(__('region.fx.col_source'))
                    ->options([
                        'cbu' => 'CBU',
                        'nbp' => 'NBP',
                        'fixer' => 'Fixer.io',
                        'manual' => __('region.fx.source.manual'),
                    ]),
                Tables\Filters\Filter::make('rate_date')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label(__('region.fx.filter_from')),
                        Forms\Components\DatePicker::make('until')->label(__('region.fx.filter_until')),
                    ])
                    ->query(static function ($query, array $data) {
                        return $query
                            ->when($data['from'] ?? null, static fn ($q, $d) => $q->whereDate('rate_date', '>=', $d))
                            ->when($data['until'] ?? null, static fn ($q, $d) => $q->whereDate('rate_date', '<=', $d));
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListExchangeRates::route('/'),
            'create' => Pages\CreateExchangeRate::route('/create'),
            'edit' => Pages\EditExchangeRate::route('/{record}/edit'),
        ];
    }

    /**
     * Trigger the FX sync job. Called by the "Refresh now" header action on
     * the index page. Falls back to a friendly notification if the job class
     * hasn't shipped yet (Agent E2 owns it).
     */
    public static function dispatchRefresh(): void
    {
        $jobClass = '\\App\\Jobs\\SyncFxRatesJob';
        if (! class_exists($jobClass)) {
            Notification::make()
                ->title(__('region.fx.notifications.job_unavailable'))
                ->body(__('region.fx.notifications.job_unavailable_body'))
                ->warning()
                ->send();
            return;
        }
        try {
            $jobClass::dispatch();
            Notification::make()
                ->title(__('region.fx.notifications.refresh_dispatched'))
                ->success()
                ->send();
        } catch (Throwable $e) {
            Notification::make()
                ->title(__('region.fx.notifications.refresh_failed'))
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    private static function formatRate(float $rate, string $to): string
    {
        $decimals = match ($to) {
            'UZS', 'KZT', 'KGS', 'RUB' => 2,
            'USD', 'EUR' => 4,
            default => 2,
        };
        return number_format($rate, $decimals, '.', ',');
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
