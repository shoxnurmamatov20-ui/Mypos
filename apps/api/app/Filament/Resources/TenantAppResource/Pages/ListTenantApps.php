<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppResource\Pages;

use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Resources\TenantAppResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

/**
 * List page for {@see TenantAppResource}.
 *
 * Two header actions:
 *   - "Set up app" — only for tenants on Plus+ (or super admins).
 *   - "Open builder" — link to the {@see \App\Filament\Pages\AppBuilder} page,
 *     a 4-step wizard recommended for first-time setup.
 *
 * Tenants below Plus normally don't see this page (the resource hides itself
 * via `shouldRegisterNavigation()`); however, if a tenant is downgraded
 * after setting up an app the page is still reachable, in which case the
 * upgrade CTA replaces the create button.
 */
class ListTenantApps extends ListRecords
{
    protected static string $resource = TenantAppResource::class;

    protected function getHeaderActions(): array
    {
        if (TenantAppResource::canCreate()) {
            return [
                Actions\Action::make('open_wizard')
                    ->label(__('app.actions.open_wizard'))
                    ->icon('heroicon-o-sparkles')
                    ->color('primary')
                    ->url(fn (): string => route('filament.admin.pages.app-builder')),
                Actions\CreateAction::make()
                    ->label(__('app.actions.create')),
            ];
        }

        return [
            Actions\Action::make('upgrade')
                ->label(__('app.actions.upgrade'))
                ->icon('heroicon-o-sparkles')
                ->color('warning')
                ->url(fn (): string => self::upgradeUrl())
                ->visible(fn (): bool => $this->canShowUpgradeCta()),
        ];
    }

    private function canShowUpgradeCta(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return false;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return ! TierFeatures::for($tenant->getAttribute('tier'))->canUseNativeApp();
    }

    private static function upgradeUrl(): string
    {
        return (string) config('app.upgrade_url', '/admin/billing');
    }
}
