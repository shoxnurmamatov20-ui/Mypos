<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantDomainResource\Pages;

use App\Domain\Tenant\Actions\VerifyDomainAction;
use App\Domain\Tenant\Models\TenantDomain;
use App\Filament\Resources\TenantDomainResource;
use Filament\Actions;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

/**
 * Detail view for a custom domain.
 *
 * Shows everything an admin needs to debug:
 *   - Domain + tenant + primary flag.
 *   - Verification status + DNS record the owner should set.
 *   - SSL status + last error (if any).
 *   - "Re-verify" header action — synchronously re-runs the DNS check.
 *
 * Uses Filament's Infolist component (read-only counterpart to Form).
 */
class ViewTenantDomain extends ViewRecord
{
    protected static string $resource = TenantDomainResource::class;

    /**
     * Polling interval used by the view to refresh SSL status while
     * provisioning. Read by the Blade view via `wire:poll.{n}s`.
     */
    public function shouldPollSsl(): bool
    {
        $record = $this->record ?? null;
        if (! $record instanceof TenantDomain) {
            return false;
        }
        // Only poll while ACME is still working — saves CPU on stable rows.
        return in_array($record->ssl_status, ['pending', 'provisioning'], true);
    }

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            Infolists\Components\Section::make(__('domain.view.basic'))
                ->schema([
                    Infolists\Components\TextEntry::make('domain')
                        ->label(__('domain.col.domain'))
                        ->copyable()
                        ->weight('semibold'),
                    Infolists\Components\TextEntry::make('tenant.name')
                        ->label(__('domain.col.tenant'))
                        ->placeholder('—'),
                    Infolists\Components\IconEntry::make('is_primary')
                        ->label(__('domain.col.primary'))
                        ->boolean(),
                    Infolists\Components\TextEntry::make('redirects_to')
                        ->label(__('domain.form.redirects_to'))
                        ->placeholder('—'),
                ])
                ->columns(2),

            Infolists\Components\Section::make(__('domain.view.verification'))
                ->schema([
                    Infolists\Components\TextEntry::make('is_verified')
                        ->label(__('domain.col.verification'))
                        ->state(fn (TenantDomain $r): string => $r->is_verified
                            ? __('domain.status.verified')
                            : __('domain.status.pending'))
                        ->badge()
                        ->color(fn (TenantDomain $r): string => $r->is_verified ? 'success' : 'warning'),
                    Infolists\Components\TextEntry::make('verification_method')
                        ->label(__('domain.col.method'))
                        ->badge(),
                    Infolists\Components\TextEntry::make('verification_token')
                        ->label(__('domain.form.token'))
                        ->copyable()
                        ->fontFamily('mono')
                        ->size('sm'),
                    Infolists\Components\TextEntry::make('verified_at')
                        ->label(__('domain.view.verified_at'))
                        ->dateTime('d.m.Y H:i')
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('last_checked_at')
                        ->label(__('domain.col.last_checked'))
                        ->since()
                        ->placeholder('—'),
                ])
                ->columns(2),

            Infolists\Components\Section::make(__('domain.view.ssl'))
                ->schema([
                    Infolists\Components\TextEntry::make('ssl_status')
                        ->label(__('domain.col.ssl'))
                        ->badge()
                        ->formatStateUsing(fn (string $s): string => __("domain.ssl.{$s}"))
                        ->color(fn (string $s): string => self::sslColor($s)),
                    Infolists\Components\TextEntry::make('ssl_issued_at')
                        ->label(__('domain.col.ssl_issued'))
                        ->dateTime('d.m.Y H:i')
                        ->placeholder('—'),
                    Infolists\Components\TextEntry::make('ssl_error')
                        ->label(__('domain.view.ssl_error'))
                        ->visible(fn (TenantDomain $r): bool => $r->ssl_error !== null && $r->ssl_error !== '')
                        ->color('danger')
                        ->columnSpanFull(),
                ])
                ->columns(2),

            Infolists\Components\Section::make(__('domain.view.timestamps'))
                ->collapsed()
                ->schema([
                    Infolists\Components\TextEntry::make('created_at')
                        ->label(__('domain.col.created'))
                        ->dateTime('d.m.Y H:i'),
                    Infolists\Components\TextEntry::make('updated_at')
                        ->label(__('domain.view.updated_at'))
                        ->dateTime('d.m.Y H:i'),
                ])
                ->columns(2),
        ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('reverify')
                ->label(__('domain.actions.reverify'))
                ->icon('heroicon-o-arrow-path')
                ->color('info')
                ->action(function (): void {
                    /** @var TenantDomain $record */
                    $record = $this->record;
                    $result = app(VerifyDomainAction::class)->execute($record);
                    $verified = (bool) ($result['verified'] ?? false);
                    Notification::make()
                        ->title($verified
                            ? __('domain.status.verified')
                            : __('domain.notifications.verify_failed_title'))
                        ->body($verified ? null : (string) ($result['reason'] ?? ''))
                        ->{$verified ? 'success' : 'warning'}()
                        ->send();
                    $this->refreshFormData(['ssl_status', 'is_verified', 'last_checked_at', 'verified_at', 'ssl_error']);
                }),
            Actions\DeleteAction::make(),
            Actions\RestoreAction::make(),
        ];
    }

    private static function sslColor(string $status): string
    {
        return match ($status) {
            'active' => 'success',
            'provisioning' => 'info',
            'pending' => 'warning',
            'error' => 'danger',
            default => 'gray',
        };
    }
}
