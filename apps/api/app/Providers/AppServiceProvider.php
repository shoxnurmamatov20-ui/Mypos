<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\AI\Contracts\AnthropicClientContract;
use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\AI\Policies\AiGenerationLogPolicy;
use App\Domain\AI\Services\AnthropicClient;
use App\Domain\Customer\Models\Customer;
use App\Domain\Customer\Policies\CustomerPolicy;
use App\Domain\Employee\Models\CourierLocation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use App\Domain\Employee\Policies\CourierLocationPolicy;
use App\Domain\Employee\Policies\EmployeePolicy;
use App\Domain\Employee\Policies\ShiftBreakPolicy;
use App\Domain\Employee\Policies\ShiftPolicy;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\Recipe;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Inventory\Policies\IngredientPolicy;
use App\Domain\Inventory\Policies\RecipePolicy;
use App\Domain\Inventory\Policies\StockMovementPolicy;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Domain\Kiosk\Policies\KioskDevicePolicy;
use App\Domain\Kiosk\Policies\KioskPairingCodePolicy;
use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Menu\Observers\MenuCacheObserver;
use App\Domain\Menu\Policies\MenuCategoryPolicy;
use App\Domain\Menu\Policies\MenuItemPolicy;
use App\Domain\Order\Models\Order;
use App\Domain\Order\Policies\OrderPolicy;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\PaymentManager;
use App\Domain\Payment\Policies\PaymentPolicy;
use App\Domain\Reports\Policies\ReportPolicy;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Domain\Tenant\Models\TenantBrand;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Observers\TenantBrandCacheObserver;
use App\Domain\Tenant\Observers\TenantRegionObserver;
use App\Domain\Tenant\Policies\TenantAppBuildPolicy;
use App\Domain\Tenant\Policies\TenantAppPolicy;
use App\Domain\Tenant\Policies\TenantBrandPolicy;
use App\Domain\Tenant\Policies\TenantDomainPolicy;
use App\Domain\Tenant\Policies\TenantPolicy;
use App\Domain\Tenant\Services\AppStoreConnectClient;
use App\Domain\Tenant\Services\GooglePlayClient;
use App\Domain\Warehouse\Models\AuditSession;
use App\Domain\Warehouse\Models\IncomingDocument;
use App\Domain\Warehouse\Models\TransferDocument;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Models\WasteDocument;
use App\Domain\Warehouse\Policies\AuditSessionPolicy;
use App\Domain\Warehouse\Policies\IncomingDocumentPolicy;
use App\Domain\Warehouse\Policies\TransferDocumentPolicy;
use App\Domain\Warehouse\Policies\WarehousePolicy;
use App\Domain\Warehouse\Policies\WasteDocumentPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentManager::class, fn (): PaymentManager => new PaymentManager);

        // ---- Phase 3 — store submission API clients --------------------
        // Singletons: credentials are static per-deploy and JWT generation
        // is cheap enough to do per-request without caching. The MyPOS-
        // owned credentials come from config; per-tenant Enterprise
        // credentials are constructed ad-hoc inside SubmitToStoreJob.
        $this->app->singleton(AppStoreConnectClient::class, function (): AppStoreConnectClient {
            $cfg = (array) config('services.apple_app_store', []);
            $rawKey = (string) ($cfg['private_key'] ?? '');
            // Stored base64-encoded so multi-line .p8 contents survive env
            // serialization. Empty string yields empty PEM — the client
            // will throw a descriptive RuntimeException on first use.
            $pem = $rawKey === '' ? '' : (string) (base64_decode($rawKey, true) ?: $rawKey);

            return new AppStoreConnectClient(
                issuerId: (string) ($cfg['issuer_id'] ?? ''),
                keyId: (string) ($cfg['key_id'] ?? ''),
                privateKey: $pem,
                baseUrl: (string) ($cfg['base_url'] ?? 'https://api.appstoreconnect.apple.com'),
            );
        });

        $this->app->singleton(GooglePlayClient::class, function (): GooglePlayClient {
            $raw = (string) config('services.google_play.service_account_json', '');
            // Same base64 round-trip pattern as Apple — survives multi-line
            // JSON in .env. Empty string yields a degraded client that
            // logs and throws on first method call.
            $json = $raw === '' ? '' : (string) (base64_decode($raw, true) ?: $raw);

            return new GooglePlayClient($json);
        });

        // ---- Phase 4 — Anthropic Messages API client ----------------------
        // Singleton because the credentials are static per-deploy and the
        // class is stateless. Empty API key yields a client that throws
        // AiDisabledException on first message() call — the controller
        // catches that and returns 503.
        //
        // Bound to BOTH the concrete class AND the contract interface — the
        // E2 menu/translator/description actions inject the concrete (they
        // use helper methods like extractJsonArray) while E3's chatbot/
        // forecast/insights services type-hint against the interface for
        // testability.
        $this->app->singleton(AnthropicClient::class, function (): AnthropicClient {
            return new AnthropicClient(
                apiKey: (string) config('anthropic.api_key', ''),
                model: (string) config('anthropic.model', 'claude-opus-4-7'),
                baseUrl: (string) config('anthropic.base_url', 'https://api.anthropic.com/v1'),
                apiVersion: (string) config('anthropic.api_version', '2023-06-01'),
                timeoutSeconds: (int) config('anthropic.timeout', 120),
                enabled: (bool) config('anthropic.enabled', true),
            );
        });
        $this->app->bind(AnthropicClientContract::class, AnthropicClient::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Employee + scheduling.
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Shift::class, ShiftPolicy::class);
        Gate::policy(ShiftBreak::class, ShiftBreakPolicy::class);
        Gate::policy(CourierLocation::class, CourierLocationPolicy::class);

        // Kiosk.
        Gate::policy(KioskDevice::class, KioskDevicePolicy::class);
        Gate::policy(KioskPairingCode::class, KioskPairingCodePolicy::class);

        // Order + Payment.
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);

        // Reports (Hisobotlar) — single policy gating the manager-panel
        // aggregates surface. Wired here so a controller can later use
        // `Gate::authorize('viewAny', ReportSubject::class)` if we add a
        // sentinel subject; for now FormRequests call ReportPolicy directly.
        Gate::define('reports.view', fn ($user): bool => (new ReportPolicy())->viewAny($user));

        // Customers.
        Gate::policy(Customer::class, CustomerPolicy::class);

        // Menu catalogue.
        Gate::policy(MenuItem::class, MenuItemPolicy::class);
        Gate::policy(MenuCategory::class, MenuCategoryPolicy::class);

        // Inventory.
        Gate::policy(Ingredient::class, IngredientPolicy::class);
        Gate::policy(Recipe::class, RecipePolicy::class);
        Gate::policy(StockMovement::class, StockMovementPolicy::class);

        // Warehouse (Ombor) — multi-warehouse, incoming, waste, audit, transfer.
        Gate::policy(Warehouse::class, WarehousePolicy::class);
        Gate::policy(IncomingDocument::class, IncomingDocumentPolicy::class);
        Gate::policy(WasteDocument::class, WasteDocumentPolicy::class);
        Gate::policy(AuditSession::class, AuditSessionPolicy::class);
        Gate::policy(TransferDocument::class, TransferDocumentPolicy::class);

        // Tenant (platform-level).
        Gate::policy(Tenant::class, TenantPolicy::class);

        // Tenant self-service (Phase 2 — branding + custom domains).
        Gate::policy(TenantBrand::class, TenantBrandPolicy::class);
        Gate::policy(TenantDomain::class, TenantDomainPolicy::class);

        // Tenant self-service (Phase 3 — native white-label apps).
        Gate::policy(TenantApp::class, TenantAppPolicy::class);
        Gate::policy(TenantAppBuild::class, TenantAppBuildPolicy::class);

        // Phase 4 — AI generation audit log (super-admin reads + owner reads).
        Gate::policy(AiGenerationLog::class, AiGenerationLogPolicy::class);

        // Public marketplace cache invalidation. Listens for menu &
        // tenant mutations and busts the corresponding public:* keys so
        // consumer apps see fresh data within the next cache miss.
        MenuItem::observe(MenuCacheObserver::class);
        MenuCategory::observe(MenuCacheObserver::class);
        Tenant::observe(MenuCacheObserver::class);

        // Phase 2 — bust resolve-domain cache when brand changes.
        TenantBrand::observe(
            TenantBrandCacheObserver::class,
        );

        // Phase 4 — derive currency_code/timezone/locale from country_code
        // when the caller didn't specify them at signup time.
        Tenant::observe(TenantRegionObserver::class);

        // Password reset URL — points at the web-portal /reset-password
        // page since this Laravel API doesn't render any web pages. The
        // user clicks the link in their email and lands on the SPA.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $portal = (string) (env('AUTH_PORTAL_FORGOT_URL') ?? 'http://localhost:3000/panel/portal/uz/reset-password');
            $email = property_exists($notifiable, 'email') ? (string) $notifiable->email : '';

            return $portal.'?token='.urlencode($token).'&email='.urlencode($email);
        });
    }
}
