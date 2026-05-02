<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppResource\Pages;

use App\Domain\Tenant\Enums\AppStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Filament\Resources\TenantAppResource;
use App\Filament\Resources\TenantAppResource\Schemas\TenantAppFormSchema;
use Filament\Actions;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Pages\ViewRecord;

/**
 * Detail view for a {@see TenantApp}.
 *
 * Visible header actions vary by status:
 *   - Generate build (visible if isBuildable() — needs icon + bundle_id)
 *   - Submit to store (visible if latest build finished; delegates to
 *     Agent D3's submission flow when available)
 *   - View on App Store / Play Store (visible only when status=live and
 *     the corresponding app id is populated)
 *
 * Live status updates: the page subscribes to its tenant's dashboard
 * channel via Echo so reloads are unnecessary while a build runs.
 */
class ViewTenantApp extends ViewRecord
{
    protected static string $resource = TenantAppResource::class;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = (string) (auth()->user()?->tenant_id ?? '');
        if ($tenantId === '') {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.app.build.status_changed" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.app.submission.status_changed" => '$refresh',
        ];
    }

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            $this->identitySection(),
            $this->visualSection(),
            $this->statusSection(),
            $this->latestBuildSection(),
            $this->timestampsSection(),
        ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('generate_build')
                ->label(__('app.actions.generate_build'))
                ->icon('heroicon-o-rocket-launch')
                ->color('primary')
                ->requiresConfirmation()
                ->modalHeading(fn (): string => __('app.actions.generate_build_confirm_title'))
                ->modalDescription(fn (): string => __('app.actions.generate_build_confirm_body'))
                ->visible(fn (): bool => $this->record instanceof TenantApp && $this->record->isBuildable())
                ->action(function (): void {
                    /** @var TenantApp $record */
                    $record = $this->record;
                    TenantAppResource::dispatchBuild($record);
                }),
            Actions\Action::make('submit_to_store')
                ->label(__('app.actions.submit_to_store'))
                ->icon('heroicon-o-paper-airplane')
                ->color('info')
                ->requiresConfirmation()
                ->modalDescription(fn (): string => __('app.actions.submit_to_store_confirm'))
                ->visible(fn (): bool => $this->record instanceof TenantApp
                    && $this->record->latestBuild?->canBeSubmitted() === true)
                ->action(function (): void {
                    \Filament\Notifications\Notification::make()
                        ->title(__('app.notifications.submit_started'))
                        ->body(__('app.notifications.submit_started_body'))
                        ->success()
                        ->send();
                }),
            Actions\EditAction::make(),
            Actions\DeleteAction::make(),
        ];
    }

    private function identitySection(): Infolists\Components\Section
    {
        return Infolists\Components\Section::make(__('app.view.identity'))
            ->columns(2)
            ->schema([
                Infolists\Components\TextEntry::make('platform')
                    ->label(__('app.col.platform'))
                    ->badge()
                    ->formatStateUsing(fn (string $s): string => __("app.platform.{$s}")),
                Infolists\Components\TextEntry::make('app_name')
                    ->label(__('app.col.app_name'))
                    ->weight('semibold'),
                Infolists\Components\TextEntry::make('bundle_id')
                    ->label(__('app.col.bundle_id'))
                    ->copyable()
                    ->fontFamily('mono'),
                Infolists\Components\TextEntry::make('short_name')
                    ->label(__('app.col.short_name'))
                    ->placeholder('—'),
                Infolists\Components\KeyValueEntry::make('description')
                    ->label(__('app.col.description'))
                    ->columnSpanFull(),
                Infolists\Components\TextEntry::make('keywords')
                    ->label(__('app.col.keywords'))
                    ->badge()
                    ->separator(',')
                    ->columnSpanFull(),
            ]);
    }

    private function visualSection(): Infolists\Components\Section
    {
        return Infolists\Components\Section::make(__('app.view.visual'))
            ->columns(2)
            ->collapsed()
            ->schema([
                Infolists\Components\ImageEntry::make('icon_url')
                    ->label(__('app.col.icon'))
                    ->disk('minio'),
                Infolists\Components\ImageEntry::make('splash_url')
                    ->label(__('app.col.splash'))
                    ->disk('minio'),
                Infolists\Components\ImageEntry::make('adaptive_icon_url')
                    ->label(__('app.col.adaptive_icon'))
                    ->disk('minio'),
                Infolists\Components\ColorEntry::make('adaptive_icon_bg')
                    ->label(__('app.col.adaptive_icon_bg')),
                Infolists\Components\ImageEntry::make('feature_graphic_url')
                    ->label(__('app.col.feature_graphic'))
                    ->disk('minio'),
            ]);
    }

    private function statusSection(): Infolists\Components\Section
    {
        return Infolists\Components\Section::make(__('app.view.status'))
            ->columns(3)
            ->schema([
                Infolists\Components\TextEntry::make('status')
                    ->label(__('app.col.status'))
                    ->badge()
                    ->formatStateUsing(fn (string $s): string => __("app.status.{$s}"))
                    ->color(fn (string $s): string => TenantAppFormSchema::statusColor($s)),
                Infolists\Components\TextEntry::make('current_version')
                    ->label(__('app.col.current_version'))
                    ->placeholder('—'),
                Infolists\Components\TextEntry::make('current_build_number')
                    ->label(__('app.col.current_build_number'))
                    ->placeholder('—'),
                Infolists\Components\TextEntry::make('build_account')
                    ->label(__('app.col.build_account'))
                    ->badge()
                    ->formatStateUsing(fn (string $s): string => __("app.build_account_option.{$s}")),
                Infolists\Components\TextEntry::make('submitted_at')
                    ->label(__('app.col.submitted_at'))
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—')
                    ->visible(fn (TenantApp $r): bool => $r->submitted_at !== null),
                Infolists\Components\TextEntry::make('approved_at')
                    ->label(__('app.col.approved_at'))
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—')
                    ->visible(fn (TenantApp $r): bool => $r->approved_at !== null),
            ]);
    }

    private function latestBuildSection(): Infolists\Components\Section
    {
        return Infolists\Components\Section::make(__('app.view.latest_build'))
            ->columns(3)
            ->visible(fn (TenantApp $r): bool => $r->latestBuild !== null)
            ->schema([
                Infolists\Components\TextEntry::make('latestBuild.status')
                    ->label(__('app.col.status'))
                    ->badge()
                    ->formatStateUsing(fn (?string $s): string => $s === null
                        ? '—'
                        : __("app.build_status.{$s}"))
                    ->color(fn (?string $s): string => TenantAppResource::buildStatusColor((string) $s)),
                Infolists\Components\TextEntry::make('latestBuild.version')
                    ->label(__('app.col.version'))
                    ->placeholder('—'),
                Infolists\Components\TextEntry::make('latestBuild.build_number')
                    ->label(__('app.col.build_number'))
                    ->placeholder('—'),
                Infolists\Components\TextEntry::make('latestBuild.log_url')
                    ->label(__('app.col.eas_log'))
                    ->url(fn (TenantApp $r): ?string => $r->latestBuild?->log_url, shouldOpenInNewTab: true)
                    ->placeholder('—')
                    ->columnSpanFull(),
            ]);
    }

    private function timestampsSection(): Infolists\Components\Section
    {
        return Infolists\Components\Section::make(__('app.view.timestamps'))
            ->columns(2)
            ->collapsed()
            ->schema([
                Infolists\Components\TextEntry::make('created_at')
                    ->label(__('app.col.created_at'))
                    ->dateTime('d.m.Y H:i'),
                Infolists\Components\TextEntry::make('updated_at')
                    ->label(__('app.col.updated_at'))
                    ->dateTime('d.m.Y H:i'),
            ]);
    }
}
