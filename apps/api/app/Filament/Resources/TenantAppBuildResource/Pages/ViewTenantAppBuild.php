<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppBuildResource\Pages;

use App\Domain\Tenant\Models\TenantAppBuild;
use App\Filament\Resources\TenantAppBuildResource;
use Filament\Actions;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Pages\ViewRecord;

/**
 * Detail view for a single build.
 *
 * Shows the full audit record:
 *   - Status pair (build + submission), version, build_number.
 *   - EAS log link (opens externally), artifact link if present.
 *   - Reviewer notes (Apple/Google rejection feedback).
 *   - Timestamps.
 *
 * Header actions mirror the row actions for in-flight / terminal states
 * (cancel, retry, download artifact, submit to store, show install QR).
 */
class ViewTenantAppBuild extends ViewRecord
{
    protected static string $resource = TenantAppBuildResource::class;

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
            Infolists\Components\Section::make(__('app.view.status'))
                ->columns(3)
                ->schema([
                    Infolists\Components\TextEntry::make('status')
                        ->label(__('app.col.status'))
                        ->badge()
                        ->formatStateUsing(fn (string $s): string => __("app.build_status.{$s}"))
                        ->color(fn (string $s): string => TenantAppBuildResource::buildStatusColor($s)),
                    Infolists\Components\TextEntry::make('submission_status')
                        ->label(__('app.col.submission_status'))
                        ->badge()
                        ->formatStateUsing(fn (string $s): string => __("app.submission.{$s}"))
                        ->color(fn (string $s): string => TenantAppBuildResource::submissionStatusColor($s)),
                    Infolists\Components\TextEntry::make('platform')
                        ->label(__('app.col.platform'))
                        ->badge()
                        ->formatStateUsing(fn (string $s): string => __("app.platform.{$s}")),
                    Infolists\Components\TextEntry::make('version')
                        ->label(__('app.col.version')),
                    Infolists\Components\TextEntry::make('build_number')
                        ->label(__('app.col.build_number')),
                    Infolists\Components\TextEntry::make('build_profile')
                        ->label(__('app.col.build_profile'))
                        ->badge()
                        ->color('gray'),
                ]),

            Infolists\Components\Section::make(__('app.view.build_log'))
                ->columns(2)
                ->schema([
                    Infolists\Components\TextEntry::make('eas_build_id')
                        ->label('EAS Build ID')
                        ->copyable()
                        ->fontFamily('mono')
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('log_url')
                        ->label(__('app.col.eas_log'))
                        ->url(fn (TenantAppBuild $r): ?string => $r->log_url, shouldOpenInNewTab: true)
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('artifact_url')
                        ->label('Artifact')
                        ->url(fn (TenantAppBuild $r): ?string => $r->artifact_url, shouldOpenInNewTab: true)
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('error_message')
                        ->label(__('app.col.error_message'))
                        ->color('danger')
                        ->columnSpanFull()
                        ->visible(fn (TenantAppBuild $r): bool => $r->error_message !== null
                            && $r->error_message !== ''),
                ]),

            Infolists\Components\Section::make(__('app.view.submission'))
                ->columns(2)
                ->visible(fn (TenantAppBuild $r): bool => $r->reviewer_notes !== null && $r->reviewer_notes !== '')
                ->schema([
                    Infolists\Components\TextEntry::make('reviewer_notes')
                        ->label(__('app.col.reviewer_notes'))
                        ->columnSpanFull(),
                ]),

            Infolists\Components\Section::make(__('app.view.qr_install'))
                ->visible(fn (TenantAppBuild $r): bool => $r->qr_code_url !== null && $r->qr_code_url !== '')
                ->schema([
                    Infolists\Components\ImageEntry::make('qr_code_url')
                        ->label('')
                        ->disk('minio'),
                ]),

            Infolists\Components\Section::make(__('app.view.timestamps'))
                ->columns(2)
                ->collapsed()
                ->schema([
                    Infolists\Components\TextEntry::make('created_at')
                        ->label(__('app.col.created_at'))
                        ->dateTime('d.m.Y H:i'),
                    Infolists\Components\TextEntry::make('started_at')
                        ->label(__('app.col.started_at'))
                        ->dateTime('d.m.Y H:i')
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('finished_at')
                        ->label(__('app.col.finished_at'))
                        ->dateTime('d.m.Y H:i')
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('updated_at')
                        ->label(__('app.col.updated_at'))
                        ->dateTime('d.m.Y H:i'),
                ]),
        ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('view_eas_log')
                ->label(__('app.actions.view_eas_log'))
                ->icon('heroicon-o-document-text')
                ->color('info')
                ->visible(fn (): bool => $this->record instanceof TenantAppBuild
                    && $this->record->log_url !== null
                    && $this->record->log_url !== '')
                ->url(fn (): ?string => $this->record instanceof TenantAppBuild ? $this->record->log_url : null,
                    shouldOpenInNewTab: true),
            Actions\Action::make('cancel_build')
                ->label(__('app.actions.cancel_build'))
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->modalDescription(fn (): string => __('app.actions.cancel_build_confirm'))
                ->visible(fn (): bool => $this->record instanceof TenantAppBuild && $this->record->isInFlight())
                ->action(function (): void {
                    /** @var TenantAppBuild $record */
                    $record = $this->record;
                    TenantAppBuildResource::cancelBuild($record);
                }),
            Actions\Action::make('retry')
                ->label(__('app.actions.retry'))
                ->icon('heroicon-o-arrow-path')
                ->color('warning')
                ->visible(fn (): bool => $this->record instanceof TenantAppBuild
                    && $this->record->isTerminal()
                    && $this->record->status !== 'finished')
                ->action(function (): void {
                    /** @var TenantAppBuild $record */
                    $record = $this->record;
                    TenantAppBuildResource::retryBuild($record);
                }),
            Actions\Action::make('submit_to_store')
                ->label(__('app.actions.submit_to_store'))
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->requiresConfirmation()
                ->modalDescription(fn (): string => __('app.actions.submit_to_store_confirm'))
                ->visible(fn (): bool => $this->record instanceof TenantAppBuild
                    && $this->record->canBeSubmitted())
                ->action(function (): void {
                    /** @var TenantAppBuild $record */
                    $record = $this->record;
                    TenantAppBuildResource::submitBuild($record);
                }),
        ];
    }
}
