<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantDomainResource\Pages;

use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Resources\TenantDomainResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListTenantDomains extends ListRecords
{
    protected static string $resource = TenantDomainResource::class;

    protected function getHeaderActions(): array
    {
        if (TenantDomainResource::canCreate()) {
            return [
                Actions\CreateAction::make()
                    ->label(__('domain.actions.add')),
            ];
        }

        // Tier-gated: show an "Upgrade" CTA instead of the create button.
        return [
            Actions\Action::make('upgrade')
                ->label(__('domain.actions.upgrade'))
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
        // Super admins always get the create button (canCreate=true above);
        // tenant admins below Plus tier see this upgrade CTA instead.
        if ($user->is_super_admin === true) {
            return false;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return ! TierFeatures::for($tenant->getAttribute('tier'))->canUseCustomDomain();
    }

    private static function upgradeUrl(): string
    {
        return (string) config('app.upgrade_url', '/admin/billing');
    }
}
