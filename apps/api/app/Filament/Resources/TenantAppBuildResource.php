<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Enums\SubmissionStatus;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Resources\TenantAppBuildResource\Pages;
use App\Filament\Resources\TenantAppBuildResource\Support\BuildActions;
use App\Models\User;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Build history — read-only audit log of every EAS Build attempt.
 *
 * Owners cannot create rows here directly; rows are produced by the
 * "Generate build" action on {@see TenantAppResource}. This Resource exposes
 * filtering / inspection / cancel / retry only.
 *
 * The list page polls every 10s while any in-flight build exists for the
 * current tenant. Status changes also stream in via the
 * `tenant.{id}.dashboard` Echo channel — Agent D3 broadcasts the events
 * once the EAS webhook reconciles a row.
 *
 * Tier gate mirrors {@see TenantAppResource} — Free / Pro tenants don't see
 * this entry in navigation.
 */
class TenantAppBuildResource extends Resource
{
    protected static ?string $model = TenantAppBuild::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 13;

    public static function getNavigationLabel(): string
    {
        return __('app.nav.builds');
    }

    public static function getModelLabel(): string
    {
        return __('app.model.build_label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('app.model.build_plural');
    }

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

    /** Builds are never created from the UI directly. */
    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Form $form): Form
    {
        // Read-only resource — form() is required by the contract but
        // unused. Returning an empty schema satisfies Filament.
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions(self::rowActions())
            ->bulkActions([])
            ->poll('10s');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenantAppBuilds::route('/'),
            'view' => Pages\ViewTenantAppBuild::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['app', 'tenant']);
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('created_at')
                ->label(__('app.col.created_at'))
                ->dateTime('d.m.Y H:i')
                ->sortable(),
            Tables\Columns\TextColumn::make('app.app_name')
                ->label(__('app.col.app'))
                ->searchable(['tenant_apps.app_name'])
                ->placeholder('—'),
            Tables\Columns\TextColumn::make('platform')
                ->label(__('app.col.platform'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("app.platform.{$s}"))
                ->color('gray'),
            Tables\Columns\TextColumn::make('status')
                ->label(__('app.col.status'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("app.build_status.{$s}"))
                ->color(fn (string $s): string => self::buildStatusColor($s)),
            Tables\Columns\TextColumn::make('submission_status')
                ->label(__('app.col.submission_status'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("app.submission.{$s}"))
                ->color(fn (string $s): string => self::submissionStatusColor($s))
                ->toggleable(),
            Tables\Columns\TextColumn::make('version')
                ->label(__('app.col.version'))
                ->badge()
                ->color('gray'),
            Tables\Columns\TextColumn::make('build_number')
                ->label(__('app.col.build_number'))
                ->badge()
                ->color('gray')
                ->toggleable(),
            Tables\Columns\TextColumn::make('started_at')
                ->label(__('app.col.started_at'))
                ->since()
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('finished_at')
                ->label(__('app.col.finished_at'))
                ->since()
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\IconColumn::make('log_url')
                ->label(__('app.col.eas_log'))
                ->state(fn (TenantAppBuild $r): bool => $r->log_url !== null && $r->log_url !== '')
                ->boolean()
                ->trueIcon('heroicon-o-link')
                ->falseIcon('heroicon-o-minus-small')
                ->trueColor('info')
                ->falseColor('gray')
                ->toggleable(),
            Tables\Columns\TextColumn::make('tenant.name')
                ->label(__('app.col.tenant'))
                ->visible(fn (): bool => self::isCurrentUserSuperAdmin())
                ->searchable(['tenants.name'])
                ->toggleable(),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('status')
                ->label(__('app.col.status'))
                ->options(self::buildStatusOptions()),
            Tables\Filters\SelectFilter::make('submission_status')
                ->label(__('app.col.submission_status'))
                ->options(self::submissionStatusOptions()),
            Tables\Filters\SelectFilter::make('platform')
                ->label(__('app.col.platform'))
                ->options([
                    AppPlatform::Ios->value => __('app.platform.ios'),
                    AppPlatform::Android->value => __('app.platform.android'),
                    AppPlatform::Universal->value => __('app.platform.universal'),
                ]),
            Tables\Filters\SelectFilter::make('tenant_app_id')
                ->label(__('app.col.app'))
                ->relationship('app', 'app_name')
                ->preload(),
            Tables\Filters\Filter::make('created_at')
                ->form([
                    \Filament\Forms\Components\DatePicker::make('from')
                        ->label('From'),
                    \Filament\Forms\Components\DatePicker::make('until')
                        ->label('Until'),
                ])
                ->query(function (Builder $q, array $data): Builder {
                    return $q
                        ->when($data['from'] ?? null, fn (Builder $b, $d) => $b->whereDate('created_at', '>=', $d))
                        ->when($data['until'] ?? null, fn (Builder $b, $d) => $b->whereDate('created_at', '<=', $d));
                }),
        ];
    }

    /** @return array<int, Tables\Actions\Action|Tables\Actions\ActionGroup> */
    private static function rowActions(): array
    {
        return [
            Tables\Actions\ActionGroup::make([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\Action::make('view_eas_log')
                    ->label(__('app.actions.view_eas_log'))
                    ->icon('heroicon-o-document-text')
                    ->color('info')
                    ->visible(fn (TenantAppBuild $r): bool => $r->log_url !== null && $r->log_url !== '')
                    ->url(fn (TenantAppBuild $r): ?string => $r->log_url, shouldOpenInNewTab: true),
                Tables\Actions\Action::make('cancel_build')
                    ->label(__('app.actions.cancel_build'))
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalDescription(fn (): string => __('app.actions.cancel_build_confirm'))
                    ->visible(fn (TenantAppBuild $r): bool => $r->isInFlight())
                    ->action(function (TenantAppBuild $record): void {
                        self::cancelBuild($record);
                    }),
                Tables\Actions\Action::make('retry')
                    ->label(__('app.actions.retry'))
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->visible(fn (TenantAppBuild $r): bool => $r->isTerminal()
                        && in_array($r->status, [
                            BuildStatus::Failed->value,
                            BuildStatus::Errored->value,
                            BuildStatus::Canceled->value,
                        ], true))
                    ->action(function (TenantAppBuild $record): void {
                        self::retryBuild($record);
                    }),
                Tables\Actions\Action::make('download_artifact')
                    ->label(__('app.actions.download_artifact'))
                    ->icon('heroicon-o-arrow-down-tray')
                    ->color('gray')
                    ->visible(fn (TenantAppBuild $r): bool => $r->artifact_url !== null && $r->artifact_url !== '')
                    ->url(fn (TenantAppBuild $r): ?string => $r->artifact_url, shouldOpenInNewTab: true),
                Tables\Actions\Action::make('show_qr')
                    ->label(__('app.actions.show_qr'))
                    ->icon('heroicon-o-qr-code')
                    ->color('info')
                    ->visible(fn (TenantAppBuild $r): bool => $r->qr_code_url !== null && $r->qr_code_url !== '')
                    ->modalContent(fn (TenantAppBuild $r): \Illuminate\Contracts\View\View => view(
                        'filament.resources.tenant-app-build.qr-modal',
                        ['url' => $r->qr_code_url],
                    ))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel(__('Close')),
                Tables\Actions\Action::make('submit_to_store')
                    ->label(__('app.actions.submit_to_store'))
                    ->icon('heroicon-o-paper-airplane')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalDescription(fn (): string => __('app.actions.submit_to_store_confirm'))
                    ->visible(fn (TenantAppBuild $r): bool => $r->canBeSubmitted())
                    ->action(function (TenantAppBuild $record): void {
                        self::submitBuild($record);
                    }),
            ]),
        ];
    }

    public static function cancelBuild(TenantAppBuild $record): void
    {
        BuildActions::cancel($record);
    }

    public static function retryBuild(TenantAppBuild $record): void
    {
        BuildActions::retry($record);
    }

    public static function submitBuild(TenantAppBuild $record): void
    {
        BuildActions::submit($record);
    }

    /** @return array<string, string> */
    public static function buildStatusOptions(): array
    {
        $options = [];
        foreach (BuildStatus::cases() as $case) {
            $options[$case->value] = __("app.build_status.{$case->value}");
        }
        return $options;
    }

    /** @return array<string, string> */
    public static function submissionStatusOptions(): array
    {
        $options = [];
        foreach (SubmissionStatus::cases() as $case) {
            $options[$case->value] = __("app.submission.{$case->value}");
        }
        return $options;
    }

    public static function buildStatusColor(string $status): string
    {
        return match ($status) {
            'finished' => 'success',
            'in_progress', 'queued' => 'info',
            'failed', 'errored' => 'danger',
            'canceled' => 'gray',
            default => 'gray',
        };
    }

    public static function submissionStatusColor(string $status): string
    {
        return match ($status) {
            'approved' => 'success',
            'in_review', 'submitted' => 'info',
            'pending' => 'warning',
            'rejected' => 'danger',
            default => 'gray',
        };
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
