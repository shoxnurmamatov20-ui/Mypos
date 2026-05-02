<?php

namespace App\Providers\Filament;

use App\Filament\Widgets\ActiveDeliveriesWidget;
use App\Filament\Widgets\ActiveKiosksWidget;
use App\Filament\Widgets\ActiveShiftsWidget;
use App\Filament\Widgets\CourierEarningsWidget;
use App\Filament\Widgets\KioskRevenueWidget;
use App\Filament\Widgets\StaffPerformanceWidget;
use App\Http\Middleware\SetTenantContext;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->colors([
                'primary' => Color::Amber,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->navigationGroups([
                'Tenants',
                'Platform',
                'AI',
                'Operatsiyalar',
                'HR',
                'Billing',
                'Settings',
                'Support',
                'Security',
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->widgets([
                Widgets\AccountWidget::class,
                StaffPerformanceWidget::class,
                CourierEarningsWidget::class,
                KioskRevenueWidget::class,
                ActiveShiftsWidget::class,
                ActiveDeliveriesWidget::class,
                ActiveKiosksWidget::class,
                Widgets\FilamentInfoWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
                // Sets app.current_tenant_id GUC AFTER authentication so RLS
                // applies correctly when production switches to non-superuser
                // mypos_app role. Super admins resolve to '*' (full access).
                SetTenantContext::class,
            ]);
    }
}
