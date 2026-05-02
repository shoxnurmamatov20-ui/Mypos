<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\AppStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Resources\TenantAppResource\Pages;
use App\Filament\Resources\TenantAppResource\Schemas\TenantAppFormSchema;
use App\Models\User;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

/**
 * Mobile App settings — per-(tenant, platform) configuration for the
 * white-labelled native app.
 *
 * Tier gate: visible only to Plus + Enterprise tenants (and super admins).
 * Tenants below Plus see neither the navigation entry nor the resource at
 * all — `shouldRegisterNavigation()` returns false. Super admins always see
 * it for support purposes.
 *
 * Lifecycle from this Resource's perspective:
 *   - Create: full form (or wizard via `AppBuilder` page); platform locks
 *     after first save because EAS builds key off bundle_id.
 *   - Edit: most fields editable; `bundle_id` becomes read-only once status
 *     in {review, live} (Apple/Google enforce immutability).
 *   - "Generate build" custom action: dispatches GenerateNativeAppAction
 *     (Agent D2) and the result lands as a new TenantAppBuild row.
 *
 * Related resources:
 *   - {@see TenantAppBuildResource} — build history (read-only)
 *   - {@see \App\Filament\Pages\AppBuilder} — first-time wizard
 */
class TenantAppResource extends Resource
{
    protected static ?string $model = TenantApp::class;

    protected static ?string $navigationIcon = 'heroicon-o-device-phone-mobile';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 12;

    /** @var array<int, string> */
    protected static array $globalSearchAttributes = ['app_name', 'bundle_id'];

    public static function getNavigationLabel(): string
    {
        return __('app.nav.apps');
    }

    public static function getModelLabel(): string
    {
        return __('app.model.app_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('app.model.app_plural');
    }

    /** @return array<int, string> */
    public static function getGloballySearchableAttributes(): array
    {
        return self::$globalSearchAttributes;
    }

    /**
     * Hide the entire navigation entry for Free / Pro tenants — they need
     * neither the management UI nor the upgrade CTA in this slot (the
     * brand-studio CTA already prompts them). Super admins always see it.
     */
    public static function shouldRegisterNavigation(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return TierFeatures::for($tenant->getAttribute('tier'))->canUseNativeApp();
    }

    public static function form(Form $form): Form
    {
        return $form->schema(TenantAppFormSchema::sections());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions(self::rowActions())
            ->bulkActions(self::bulkActions());
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenantApps::route('/'),
            'create' => Pages\CreateTenantApp::route('/create'),
            'view' => Pages\ViewTenantApp::route('/{record}'),
            'edit' => Pages\EditTenantApp::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['tenant', 'latestBuild'])
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    public static function canCreate(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return TierFeatures::for($tenant->getAttribute('tier'))->canUseNativeApp();
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('platform')
                ->label(__('app.col.platform'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("app.platform.{$s}"))
                ->color('gray'),
            Tables\Columns\TextColumn::make('app_name')
                ->label(__('app.col.app_name'))
                ->searchable()
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('bundle_id')
                ->label(__('app.col.bundle_id'))
                ->copyable()
                ->fontFamily('mono')
                ->size('sm'),
            Tables\Columns\TextColumn::make('tenant.name')
                ->label(__('app.col.tenant'))
                ->visible(fn (): bool => self::isCurrentUserSuperAdmin())
                ->toggleable()
                ->searchable(['tenants.name']),
            Tables\Columns\TextColumn::make('status')
                ->label(__('app.col.status'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("app.status.{$s}"))
                ->color(fn (string $s): string => TenantAppFormSchema::statusColor($s)),
            Tables\Columns\TextColumn::make('current_version')
                ->label(__('app.col.current_version'))
                ->badge()
                ->color('gray')
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('latestBuild.status')
                ->label(__('app.col.latest_build'))
                ->badge()
                ->placeholder('—')
                ->formatStateUsing(fn (?string $s): string => $s === null
                    ? '—'
                    : __("app.build_status.{$s}"))
                ->color(fn (?string $s): string => self::buildStatusColor((string) $s)),
            Tables\Columns\TextColumn::make('updated_at')
                ->label(__('app.col.updated_at'))
                ->since()
                ->sortable()
                ->toggleable(),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('platform')
                ->label(__('app.col.platform'))
                ->options(TenantAppFormSchema::platformOptions()),
            Tables\Filters\SelectFilter::make('status')
                ->label(__('app.col.status'))
                ->options(self::statusOptions()),
            Tables\Filters\SelectFilter::make('build_account')
                ->label(__('app.col.build_account'))
                ->options([
                    'mypos' => __('app.build_account_option.mypos'),
                    'tenant' => __('app.build_account_option.tenant'),
                ]),
            Tables\Filters\TrashedFilter::make(),
        ];
    }

    /** @return array<int, Tables\Actions\Action|Tables\Actions\ActionGroup> */
    private static function rowActions(): array
    {
        return [
            Tables\Actions\ActionGroup::make([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('generate_build')
                    ->label(__('app.actions.generate_build'))
                    ->icon('heroicon-o-rocket-launch')
                    ->color('primary')
                    ->requiresConfirmation()
                    ->modalHeading(fn (): string => __('app.actions.generate_build_confirm_title'))
                    ->modalDescription(fn (): string => __('app.actions.generate_build_confirm_body'))
                    ->visible(fn (TenantApp $r): bool => $r->isBuildable())
                    ->action(function (TenantApp $record): void {
                        self::dispatchBuild($record);
                    }),
                Tables\Actions\Action::make('view_app_store')
                    ->label(__('app.actions.view_app_store'))
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->color('gray')
                    ->visible(fn (TenantApp $r): bool => $r->status === AppStatus::Live
                        && $r->apple_app_id !== null)
                    ->url(
                        fn (TenantApp $r): ?string => $r->apple_app_id !== null
                            ? "https://apps.apple.com/app/id{$r->apple_app_id}"
                            : null,
                        shouldOpenInNewTab: true,
                    ),
                Tables\Actions\Action::make('view_play_store')
                    ->label(__('app.actions.view_play_store'))
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->color('gray')
                    ->visible(fn (TenantApp $r): bool => $r->status === AppStatus::Live
                        && $r->google_package_name !== null)
                    ->url(
                        fn (TenantApp $r): ?string => $r->google_package_name !== null
                            ? "https://play.google.com/store/apps/details?id={$r->google_package_name}"
                            : null,
                        shouldOpenInNewTab: true,
                    ),
                Tables\Actions\DeleteAction::make(),
            ]),
        ];
    }

    /** @return array<int, Tables\Actions\BulkAction|Tables\Actions\BulkActionGroup> */
    private static function bulkActions(): array
    {
        return [
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\DeleteBulkAction::make(),
                Tables\Actions\RestoreBulkAction::make(),
            ]),
        ];
    }

    /**
     * Dispatch a build via the canonical Action layer when available.
     * Agent D2 owns `GenerateNativeAppAction`; until that lands we surface
     * a friendly notification rather than throwing — the resource still
     * compiles and lists / forms still function.
     */
    public static function dispatchBuild(TenantApp $record): void
    {
        $actionClass = '\\App\\Domain\\Tenant\\Actions\\GenerateNativeAppAction';
        if (! class_exists($actionClass)) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body(__('app.notifications.action_unavailable_body'))
                ->warning()
                ->send();
            return;
        }
        try {
            // Action layer uses __invoke (callable) — supports both
            // `$action($record)` and `$action->__invoke($record)`. We intentionally
            // do NOT call `->execute()` because GenerateNativeAppAction defines
            // only `__invoke`.
            $action = app($actionClass);
            if (is_callable($action)) {
                $action($record);
            } elseif (method_exists($action, 'execute')) {
                $action->execute($record);
            }
            Notification::make()
                ->title(__('app.notifications.build_started'))
                ->body(__('app.notifications.build_started_body'))
                ->success()
                ->send();
        } catch (\Throwable $e) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    /** @return array<string, string> */
    public static function statusOptions(): array
    {
        $options = [];
        foreach (AppStatus::cases() as $case) {
            $options[$case->value] = __("app.status.{$case->value}");
        }
        return $options;
    }

    public static function buildStatusColor(string $status): string
    {
        return match ($status) {
            'finished' => 'success',
            // BuildStatus::InProgress is `'in-progress'` (hyphen, matches EAS API).
            'in-progress', 'queued' => 'info',
            'failed', 'errored' => 'danger',
            'canceled' => 'gray',
            default => 'gray',
        };
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
