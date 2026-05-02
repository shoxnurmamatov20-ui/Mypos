<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppBuildResource\Pages;

use App\Filament\Resources\TenantAppBuildResource;
use Filament\Resources\Pages\ListRecords;

/**
 * Build-history index page.
 *
 * Subscribes to the tenant's dashboard channel for live status updates so
 * the page refreshes when an EAS webhook lands without waiting for the
 * 10s table poll. Both signals coexist: poll catches missed webhook events,
 * Echo gives sub-second responsiveness when the WebSocket is healthy.
 */
class ListTenantAppBuilds extends ListRecords
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

    /** No header actions — builds are created via TenantAppResource. */
    protected function getHeaderActions(): array
    {
        return [];
    }
}
