<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Enums\AiGenerationStatus;
use App\Domain\AI\Models\AiGenerationLog;
use App\Filament\Resources\AiGenerationLogResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Read-only audit log of every Anthropic Messages API call.
 *
 * Each row is appended by {@see \App\Domain\AI\Services\AnthropicClient}
 * — both successes and failures — and drives:
 *   - Cost dashboards (sum cost_usd by tenant + day)
 *   - Per-tenant rate-limit checks ({@see \App\Domain\AI\Services\AiQuotaGuard})
 *   - Debug surfaces for support tickets
 *
 * Surface decisions:
 *   - Read-only: `canCreate()` returns false, no edit / delete actions.
 *   - Tenant scope is bypassed for super admins via `getEloquentQuery()` so
 *     the platform team can see every tenant's calls; tenant admins see only
 *     their own rows by virtue of the BelongsToTenant scope on the model.
 *   - View action surfaces the JSON request/response payloads for debugging.
 *
 * Stats widget on the index page is registered via `getHeaderWidgets()` —
 * see {@see \App\Filament\Widgets\AiCostWidget}.
 */
class AiGenerationLogResource extends Resource
{
    protected static ?string $model = AiGenerationLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationGroup = 'AI';

    protected static ?int $navigationSort = 2;

    public static function getNavigationLabel(): string
    {
        return __('ai_studio.usage.nav_label');
    }

    public static function getModelLabel(): string
    {
        return __('ai_studio.usage.model_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('ai_studio.usage.plural_label');
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns(self::columns())
            ->filters(self::filters())
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiGenerationLogs::route('/'),
            'view' => Pages\ViewAiGenerationLog::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()
            ->with(['user']);

        // Super admins see everything — tenant admins see only their own rows.
        $user = auth()->user();
        if ($user instanceof User && $user->is_super_admin === true) {
            return $query->withoutGlobalScopes();
        }

        return $query;
    }

    public static function canCreate(): bool
    {
        return false;
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function columns(): array
    {
        return [
            Tables\Columns\TextColumn::make('created_at')
                ->label(__('ai_studio.usage.col_created_at'))
                ->dateTime('d.m.Y H:i:s')
                ->sortable(),
            Tables\Columns\TextColumn::make('feature')
                ->label(__('ai_studio.usage.col_feature'))
                ->badge()
                ->formatStateUsing(static function (mixed $state): string {
                    if ($state instanceof AiFeature) {
                        return $state->label();
                    }
                    return is_string($state)
                        ? (AiFeature::tryFrom($state)?->label() ?? $state)
                        : '—';
                })
                ->color(static fn (mixed $state): string => self::featureColor(self::featureValue($state))),
            Tables\Columns\TextColumn::make('model')
                ->label(__('ai_studio.usage.col_model'))
                ->color('gray')
                ->fontFamily('mono')
                ->size('sm'),
            Tables\Columns\TextColumn::make('input_tokens')
                ->label(__('ai_studio.usage.col_input_tokens'))
                ->numeric()
                ->sortable(),
            Tables\Columns\TextColumn::make('output_tokens')
                ->label(__('ai_studio.usage.col_output_tokens'))
                ->numeric()
                ->sortable(),
            Tables\Columns\TextColumn::make('cost_usd')
                ->label(__('ai_studio.usage.col_cost'))
                ->formatStateUsing(static fn ($state): string => '$' . number_format((float) $state, 4))
                ->sortable()
                ->alignRight(),
            Tables\Columns\TextColumn::make('status')
                ->label(__('ai_studio.usage.col_status'))
                ->badge()
                ->formatStateUsing(static function (mixed $state): string {
                    return is_string($state) ? $state : ($state?->value ?? '—');
                })
                ->color(static fn (mixed $state): string => self::statusValue($state) === 'error'
                    ? 'danger'
                    : 'success'),
            Tables\Columns\TextColumn::make('duration_ms')
                ->label(__('ai_studio.usage.col_duration'))
                ->formatStateUsing(static fn ($state): string => number_format((float) $state) . ' ms')
                ->sortable()
                ->alignRight(),
            Tables\Columns\TextColumn::make('user.name')
                ->label(__('ai_studio.usage.col_user'))
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('tenant_id')
                ->label(__('ai_studio.usage.col_tenant'))
                ->copyable()
                ->fontFamily('mono')
                ->size('sm')
                ->toggleable(isToggledHiddenByDefault: true)
                ->visible(fn (): bool => self::isCurrentUserSuperAdmin()),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function filters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('feature')
                ->label(__('ai_studio.usage.col_feature'))
                ->options(collect(AiFeature::cases())
                    ->mapWithKeys(static fn (AiFeature $c): array => [$c->value => $c->label()])
                    ->toArray()),
            Tables\Filters\SelectFilter::make('status')
                ->label(__('ai_studio.usage.col_status'))
                ->options(collect(AiGenerationStatus::cases())
                    ->mapWithKeys(static fn (AiGenerationStatus $c): array => [$c->value => ucfirst($c->value)])
                    ->toArray()),
            Tables\Filters\Filter::make('created_at')
                ->form([
                    Forms\Components\DatePicker::make('from')->label(__('ai_studio.usage.filter_from')),
                    Forms\Components\DatePicker::make('until')->label(__('ai_studio.usage.filter_until')),
                ])
                ->query(static function ($query, array $data) {
                    return $query
                        ->when($data['from'] ?? null, static fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                        ->when($data['until'] ?? null, static fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                }),
        ];
    }

    private static function featureValue(mixed $state): string
    {
        if ($state instanceof AiFeature) {
            return $state->value;
        }
        return is_string($state) ? $state : '';
    }

    private static function statusValue(mixed $state): string
    {
        if ($state instanceof AiGenerationStatus) {
            return $state->value;
        }
        return is_string($state) ? $state : '';
    }

    private static function featureColor(string $feature): string
    {
        return match ($feature) {
            'menu_generator' => 'success',
            'translator' => 'info',
            'description' => 'primary',
            'demand_forecast' => 'warning',
            'chatbot' => 'gray',
            default => 'gray',
        };
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
