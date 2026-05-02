<?php

use App\Http\Controllers\Api\V1\Admin\AIController as AdminAIController;
use App\Http\Controllers\Api\V1\Admin\AppController as AdminAppController;
use App\Http\Controllers\Api\V1\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Api\V1\Admin\BuildSubmissionController as AdminBuildSubmissionController;
use App\Http\Controllers\Api\V1\Admin\DomainController as AdminDomainController;
use App\Http\Controllers\Api\V1\Admin\ForecastController as AdminForecastController;
use App\Http\Controllers\Api\V1\Admin\InsightsController as AdminInsightsController;
use App\Http\Controllers\Api\V1\Admin\TierFeatureController as AdminTierFeatureController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Broadcasting\BroadcastAuthController;
use App\Http\Controllers\Api\V1\Customer\CustomerController;
use App\Http\Controllers\Api\V1\Employee\ClockController;
use App\Http\Controllers\Api\V1\Employee\EmployeeController;
use App\Http\Controllers\Api\V1\Employee\ShiftController;
use App\Http\Controllers\Api\V1\Internal\CaddyVerifyController;
use App\Http\Controllers\Api\V1\Inventory\IngredientController;
use App\Http\Controllers\Api\V1\Inventory\InventoryReportController;
use App\Http\Controllers\Api\V1\Inventory\RecipeController;
use App\Http\Controllers\Api\V1\Inventory\StockMovementController;
use App\Http\Controllers\Api\V1\Kiosk\KioskHeartbeatController;
use App\Http\Controllers\Api\V1\Kiosk\KioskMenuController;
use App\Http\Controllers\Api\V1\Kiosk\KioskOrderController;
use App\Http\Controllers\Api\V1\Kiosk\KioskOrderStatusController;
use App\Http\Controllers\Api\V1\Kiosk\KioskPairController;
use App\Http\Controllers\Api\V1\Kiosk\KioskPaymentController;
use App\Http\Controllers\Api\V1\Menu\MenuCategoryController;
use App\Http\Controllers\Api\V1\Menu\MenuItemController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Payment\PaymentController;
use App\Http\Controllers\Api\V1\Public\ChatController as PublicChatController;
use App\Http\Controllers\Api\V1\Public\OnboardingController;
use App\Http\Controllers\Api\V1\Public\PublicCurrencyController;
use App\Http\Controllers\Api\V1\Public\PublicExchangeRateController;
use App\Http\Controllers\Api\V1\Public\PublicMenuController;
use App\Http\Controllers\Api\V1\Public\PublicOrderController;
use App\Http\Controllers\Api\V1\Public\PublicRestaurantController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierAcceptController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierActiveController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierAvailableController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierCancelController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierDeliverController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierEarningsController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierHistoryController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierLocationController;
use App\Http\Controllers\Api\V1\Staff\Courier\CourierPickupController;
use App\Http\Controllers\Api\V1\Staff\StaffAuthController;
use App\Http\Controllers\Api\V1\Staff\StaffBreakController;
use App\Http\Controllers\Api\V1\Staff\StaffClockController;
use App\Http\Controllers\Api\V1\Staff\StaffKitchenController;
use App\Http\Controllers\Api\V1\Staff\StaffMeController;
use App\Http\Controllers\Api\V1\Staff\StaffOrderController;
use App\Http\Controllers\Api\V1\Staff\StaffShiftController;
use App\Http\Controllers\Api\V1\Staff\StaffStatsController;
use App\Http\Controllers\Api\V1\SuperAdmin\AuditLogController as SuperAdminAuditLogController;
use App\Http\Controllers\Api\V1\SuperAdmin\BillingController as SuperAdminBillingController;
use App\Http\Controllers\Api\V1\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\Api\V1\SuperAdmin\SettingsController as SuperAdminSettingsController;
use App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminMeController;
use App\Http\Controllers\Api\V1\SuperAdmin\SuperAdminTeamController;
use App\Http\Controllers\Api\V1\SuperAdmin\TenantController as SuperAdminTenantController;
use App\Http\Controllers\Api\V1\Table\TableCategoryController;
use App\Http\Controllers\Api\V1\Table\TableController;
use App\Http\Controllers\Api\V1\Webhook\ClickWebhookController;
use App\Http\Controllers\Api\V1\Webhook\EasBuildWebhookController;
use App\Http\Controllers\Api\V1\Webhook\PaymeWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — V1
|--------------------------------------------------------------------------
| All API endpoints live under /api/v1/*. Never break v1 contract —
| introduce v2 for breaking changes. See CLAUDE.md for conventions.
*/

// --- Reverb / Pusher channel auth ---
// Reverb (Pusher protocol) calls POST /api/broadcasting/auth for every
// PrivateChannel / PresenceChannel subscribe. The channel closures live in
// routes/channels.php — they accept `?User $user` so the guest order-tracking
// channel can authorize via tracking_token. The controller does *optional*
// sanctum auth so authenticated requests get a User and guests still reach
// the closures.
Route::post('/broadcasting/auth', BroadcastAuthController::class)
    ->middleware('throttle:120,1')
    ->name('broadcasting.auth');

// --- Internal endpoints (not part of the public v1 contract) -------------
// These are operational hooks consumed by infra components (Caddy reverse
// proxy, monitoring, etc.). They are gated by `internal.caddy` which checks
// either a shared-secret header (X-Caddy-Token) or loopback origin, and
// they intentionally live outside `/api/v1/` so they cannot be confused
// with versioned customer-facing endpoints.
Route::prefix('internal')->middleware(['internal.caddy'])->group(function (): void {
    // Caddy on-demand TLS "ask" endpoint — see CaddyVerifyController.
    Route::get('/caddy/verify', [CaddyVerifyController::class, 'verify'])
        ->middleware('throttle:600,1')
        ->name('internal.caddy.verify');
});

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => '0.1.0',
            'service' => 'mypos-api',
            'timestamp' => now()->toIso8601String(),
            'locale' => app()->getLocale(),
            'timezone' => config('app.timezone'),
        ]);
    })->name('v1.health');

    // --- Public (unauthenticated) endpoints — marketplace + QR-menu PWA ---
    // Default 60 req/min per IP for read endpoints. Writes use stricter caps
    // because guest checkout is the most-abused public surface.
    Route::prefix('public')->group(function () {
        // Marketplace listing + detail
        Route::get('/restaurants', [PublicRestaurantController::class, 'index'])
            ->middleware('throttle:60,1')
            ->name('v1.public.restaurants.index');
        Route::get('/restaurants/{slug}', [PublicRestaurantController::class, 'show'])
            ->middleware('throttle:60,1')
            ->name('v1.public.restaurants.show');

        // Menu (cached + ETag) — used by both QR menu and marketplace
        Route::get('/menu/{slug}', [PublicMenuController::class, 'show'])
            ->middleware('throttle:60,1')
            ->name('v1.public.menu.show');

        // Phase 2 — host → tenant resolver (custom domain frontends call this
        // from their middleware to decide if a hostname is a registered
        // tenant and what brand to render under).
        Route::get('/resolve-domain', \App\Http\Controllers\Api\V1\Public\PublicResolveDomainController::class)
            ->middleware('throttle:120,1')
            ->name('v1.public.resolve_domain');

        // Marketplace guest checkout — strict per-IP throttle, validation
        // includes phone so abuse on a single IP+phone pair is bounded.
        Route::post('/orders', [PublicOrderController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('v1.public.orders.store');

        // Guest order tracking — token is the credential
        Route::get('/orders/track/{token}', [PublicOrderController::class, 'track'])
            ->middleware('throttle:30,1')
            ->name('v1.public.orders.track');

        // Legacy QR-menu PWA store endpoint — kept for backwards compatibility
        Route::post('/menu/{slug}/orders', [PublicOrderController::class, 'storeForQrMenu'])
            ->middleware('throttle:30,1')
            ->name('v1.public.qr_orders.store');

        // --- Phase 4 (E4) — Multi-currency reference -----------------------
        // Static-ish lookups used by the marketing wizard and the consumer
        // marketplace currency selector. Heavily cached (1h Redis, 10m
        // browser) — these change on the order of weeks.
        Route::get('/currencies', [PublicCurrencyController::class, 'index'])
            ->middleware('throttle:60,1')
            ->name('v1.public.currencies.index');

        // FX lookup: GET /api/v1/public/exchange-rates?from=USD&to=UZS&date=YYYY-MM-DD
        // Returns the rate at the requested date, falling back through
        // direct → inverse → USD-pivot in FxRateService. 404 when no rate
        // is available — clients must degrade gracefully.
        Route::get('/exchange-rates', [PublicExchangeRateController::class, 'show'])
            ->middleware('throttle:60,1')
            ->name('v1.public.exchange_rates.show');

        // --- Phase 4 (E3) — Customer-facing chatbot ----------------------
        // Tenant resolution happens in `ResolveTenantFromDomain` middleware
        // (binds `currentTenant` from the Host header). The controller
        // additionally enforces a Plus+ tier gate. Throttle: 30 messages
        // per hour per IP — abusive clients see 429 long before they can
        // burn meaningful AI tokens.
        Route::post('/chat', [PublicChatController::class, 'reply'])
            ->middleware('throttle:30,60')
            ->name('v1.public.chat.reply');

        // --- Self-service onboarding wizard (5 steps) ---
        // Heavily throttled because each call is a potential write that
        // creates `tenant_registrations` rows or invokes the AI provider.
        // Each route returns a stable contract documented on
        // `OnboardingController` so the marketing wizard can be wired
        // independently of the underlying provisioning code.
        Route::prefix('onboarding')->group(function () {
            Route::post('/start', [OnboardingController::class, 'start'])
                ->middleware('throttle:5,15')
                ->name('v1.public.onboarding.start');

            Route::post('/menu-generate', [OnboardingController::class, 'menuGenerate'])
                ->middleware('throttle:10,60')
                ->name('v1.public.onboarding.menu_generate');

            Route::post('/submit', [OnboardingController::class, 'submit'])
                ->middleware('throttle:5,15')
                ->name('v1.public.onboarding.submit');
        });
    });

    // --- Public payment webhooks (no auth, no CSRF) ---
    // SECURITY (C3): rate-limited per-IP and gated by an optional IP allowlist
    // (see config/payment.php). Stub-mode is refused in production by the
    // provider classes themselves (defence-in-depth).
    Route::prefix('webhooks')->group(function () {
        Route::post('/click', [ClickWebhookController::class, 'handle'])
            ->middleware(['throttle:60,1', 'payment.webhook.ips:click'])
            ->name('v1.webhooks.click');

        Route::post('/payme', [PaymeWebhookController::class, 'handle'])
            ->middleware(['throttle:60,1', 'payment.webhook.ips:payme'])
            ->name('v1.webhooks.payme');

        // --- Phase 3 — EAS Build webhook ---
        // Signed by HMAC-SHA1 in `expo-signature` header. Throttled at 120/min
        // to absorb retries while remaining abuse-resistant. Signature mismatch
        // returns 403; missing secret returns 503 (fail-closed).
        Route::post('/eas-build', [EasBuildWebhookController::class, 'handle'])
            ->middleware('throttle:120,1')
            ->name('v1.webhooks.eas_build');
    });

    // --- Self-service kiosk: pair (public, rate-limited) + device-token group ---
    Route::post('/kiosk/pair', [KioskPairController::class, 'pair'])
        ->middleware('throttle:10,15')
        ->name('v1.kiosk.pair');

    Route::middleware('kiosk.device')->prefix('kiosk')->group(function () {
        Route::post('/heartbeat', [KioskHeartbeatController::class, 'beat'])
            ->name('v1.kiosk.heartbeat');
        Route::get('/menu', [KioskMenuController::class, 'index'])
            ->name('v1.kiosk.menu.index');
        Route::post('/orders', [KioskOrderController::class, 'store'])
            ->name('v1.kiosk.orders.store');
        Route::get('/orders/{order}', [KioskOrderStatusController::class, 'show'])
            ->name('v1.kiosk.orders.show');
        Route::post('/payment-intent', [KioskPaymentController::class, 'create'])
            ->name('v1.kiosk.payment.create');
        Route::post('/payment-intent/{payment}/capture', [KioskPaymentController::class, 'capture'])
            ->name('v1.kiosk.payment.capture');
    });

    // --- Auth (public login + authenticated me/logout) ---
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1')
            ->name('v1.auth.login');

        // Staff PIN login — IP-level throttle here, per-phone limiter inside the controller.
        Route::post('/staff-login', [StaffAuthController::class, 'login'])
            ->middleware('throttle:30,1')
            ->name('v1.auth.staff_login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me'])->name('v1.auth.me');
            Route::post('/logout', [AuthController::class, 'logout'])->name('v1.auth.logout');
        });
    });

    // --- Authenticated domain routes ---
    Route::middleware('auth:sanctum')->group(function () {
        // Menu
        Route::prefix('menu')->group(function () {
            Route::get('/categories', [MenuCategoryController::class, 'index'])->name('v1.menu.categories.index');
            Route::post('/categories', [MenuCategoryController::class, 'store'])->name('v1.menu.categories.store');
            Route::get('/categories/{category}', [MenuCategoryController::class, 'show'])->name('v1.menu.categories.show');
            Route::patch('/categories/{category}', [MenuCategoryController::class, 'update'])->name('v1.menu.categories.update');
            Route::delete('/categories/{category}', [MenuCategoryController::class, 'destroy'])->name('v1.menu.categories.destroy');

            Route::get('/items', [MenuItemController::class, 'index'])->name('v1.menu.items.index');
            Route::post('/items', [MenuItemController::class, 'store'])->name('v1.menu.items.store');
            Route::get('/items/{item}', [MenuItemController::class, 'show'])->name('v1.menu.items.show');
            Route::patch('/items/{item}', [MenuItemController::class, 'update'])->name('v1.menu.items.update');
            Route::delete('/items/{item}', [MenuItemController::class, 'destroy'])->name('v1.menu.items.destroy');
        });

        // Tables
        Route::prefix('tables')->group(function () {
            Route::get('/categories', [TableCategoryController::class, 'index'])->name('v1.tables.categories.index');
            Route::post('/categories', [TableCategoryController::class, 'store'])->name('v1.tables.categories.store');
            Route::patch('/categories/{tableCategory}', [TableCategoryController::class, 'update'])->name('v1.tables.categories.update');
            Route::delete('/categories/{tableCategory}', [TableCategoryController::class, 'destroy'])->name('v1.tables.categories.destroy');
        });
        Route::get('/tables', [TableController::class, 'index'])->name('v1.tables.index');
        Route::post('/tables', [TableController::class, 'store'])->name('v1.tables.store');
        Route::get('/tables/{table}', [TableController::class, 'show'])->name('v1.tables.show');
        Route::patch('/tables/{table}', [TableController::class, 'update'])->name('v1.tables.update');
        Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus'])->name('v1.tables.status');
        Route::delete('/tables/{table}', [TableController::class, 'destroy'])->name('v1.tables.destroy');

        // Orders
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('v1.orders.index');
            Route::post('/', [OrderController::class, 'store'])->name('v1.orders.store');
            // Stats routes must be registered BEFORE /{order} to avoid route binding conflicts.
            Route::get('/stats/summary', [OrderController::class, 'summary'])->name('v1.orders.stats.summary');
            Route::get('/{order}', [OrderController::class, 'show'])->name('v1.orders.show');
            Route::patch('/{order}/status', [OrderController::class, 'updateStatus'])->name('v1.orders.status');
        });

        // Customers
        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])->name('v1.customers.index');
            Route::post('/', [CustomerController::class, 'store'])->name('v1.customers.store');
            Route::get('/{customer}', [CustomerController::class, 'show'])->name('v1.customers.show');
            Route::patch('/{customer}', [CustomerController::class, 'update'])->name('v1.customers.update');
            Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('v1.customers.destroy');
        });

        // Employees
        Route::prefix('employees')->group(function () {
            Route::get('/', [EmployeeController::class, 'index'])->name('v1.employees.index');
            Route::post('/', [EmployeeController::class, 'store'])->name('v1.employees.store');
            Route::get('/{employee}', [EmployeeController::class, 'show'])->name('v1.employees.show');
            Route::patch('/{employee}', [EmployeeController::class, 'update'])->name('v1.employees.update');
            Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('v1.employees.destroy');
        });

        // Shifts
        Route::prefix('shifts')->group(function () {
            Route::get('/', [ShiftController::class, 'index'])->name('v1.shifts.index');
            Route::post('/', [ShiftController::class, 'store'])->name('v1.shifts.store');
            Route::delete('/{shift}', [ShiftController::class, 'destroy'])->name('v1.shifts.destroy');
        });

        // Clock in/out
        Route::post('/clock/in', [ClockController::class, 'clockIn'])->name('v1.clock.in');
        Route::post('/clock/out', [ClockController::class, 'clockOut'])->name('v1.clock.out');

        // Inventory
        Route::prefix('inventory')->group(function () {
            Route::get('/ingredients', [IngredientController::class, 'index'])->name('v1.inventory.ingredients.index');
            Route::post('/ingredients', [IngredientController::class, 'store'])->name('v1.inventory.ingredients.store');
            Route::get('/ingredients/{ingredient}', [IngredientController::class, 'show'])->name('v1.inventory.ingredients.show');
            Route::patch('/ingredients/{ingredient}', [IngredientController::class, 'update'])->name('v1.inventory.ingredients.update');
            Route::delete('/ingredients/{ingredient}', [IngredientController::class, 'destroy'])->name('v1.inventory.ingredients.destroy');
            Route::post('/ingredients/{ingredient}/adjust', [StockMovementController::class, 'adjust'])->name('v1.inventory.ingredients.adjust');
            Route::get('/ingredients/{ingredient}/movements', [StockMovementController::class, 'index'])->name('v1.inventory.movements.index');
            Route::get('/recipes', [RecipeController::class, 'index'])->name('v1.inventory.recipes.index');
            Route::post('/recipes', [RecipeController::class, 'store'])->name('v1.inventory.recipes.store');
            Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('v1.inventory.recipes.destroy');
            Route::get('/low-stock', [InventoryReportController::class, 'lowStock'])->name('v1.inventory.low_stock');
            Route::get('/valuation', [InventoryReportController::class, 'valuation'])->name('v1.inventory.valuation');
        });

        // Payments
        Route::prefix('payments')->group(function () {
            Route::post('/', [PaymentController::class, 'store'])->name('v1.payments.store');
            Route::get('/{payment}', [PaymentController::class, 'show'])->name('v1.payments.show');
            Route::post('/{payment}/capture', [PaymentController::class, 'captureCash'])->name('v1.payments.capture');
            Route::post('/{payment}/refund', [PaymentController::class, 'refund'])->name('v1.payments.refund');
        });
    });

    // --- Super-admin (SaaS owner panel) ---
    Route::prefix('super-admin')->group(function () {
        // Public auth endpoints (rate-limited)
        Route::post('/login', [SuperAdminAuthController::class, 'login'])
            ->middleware('throttle:20,15')
            ->name('v1.super_admin.login');

        Route::post('/admins/accept-invitation', [SuperAdminTeamController::class, 'acceptInvitation'])
            ->middleware('throttle:5,15')
            ->name('v1.super_admin.admins.accept_invitation');

        // Authenticated super admin endpoints
        Route::middleware(['auth:sanctum', 'super-admin'])->group(function () {
            Route::get('/me', [SuperAdminMeController::class, 'show'])
                ->name('v1.super_admin.me');
            Route::post('/logout', [SuperAdminAuthController::class, 'logout'])
                ->name('v1.super_admin.logout');

            // Dashboard
            Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])
                ->name('v1.super_admin.dashboard');
            Route::get('/dashboard/charts', [SuperAdminDashboardController::class, 'charts'])
                ->name('v1.super_admin.dashboard.charts');

            // Tenants — explicit registration so list precedes /{tenant}
            Route::get('/tenants', [SuperAdminTenantController::class, 'index'])
                ->name('v1.super_admin.tenants.index');
            Route::post('/tenants', [SuperAdminTenantController::class, 'store'])
                ->name('v1.super_admin.tenants.store');
            Route::get('/tenants/{tenant}', [SuperAdminTenantController::class, 'show'])
                ->name('v1.super_admin.tenants.show');
            Route::patch('/tenants/{tenant}', [SuperAdminTenantController::class, 'update'])
                ->name('v1.super_admin.tenants.update');
            Route::delete('/tenants/{tenant}', [SuperAdminTenantController::class, 'destroy'])
                ->name('v1.super_admin.tenants.destroy');
            Route::post('/tenants/{tenant}/suspend', [SuperAdminTenantController::class, 'suspend'])
                ->name('v1.super_admin.tenants.suspend');
            Route::post('/tenants/{tenant}/resume', [SuperAdminTenantController::class, 'resume'])
                ->name('v1.super_admin.tenants.resume');
            Route::post('/tenants/{tenant}/impersonate', [SuperAdminTenantController::class, 'impersonate'])
                ->name('v1.super_admin.tenants.impersonate');

            // Audit logs
            Route::get('/audit-logs/actions', [SuperAdminAuditLogController::class, 'actions'])
                ->name('v1.super_admin.audit_logs.actions');
            Route::get('/audit-logs', [SuperAdminAuditLogController::class, 'index'])
                ->name('v1.super_admin.audit_logs.index');

            // Billing
            Route::get('/billing/subscriptions', [SuperAdminBillingController::class, 'subscriptions'])
                ->name('v1.super_admin.billing.subscriptions');
            Route::get('/billing/mrr-breakdown', [SuperAdminBillingController::class, 'mrrBreakdown'])
                ->name('v1.super_admin.billing.mrr_breakdown');

            // Team management
            Route::get('/admins', [SuperAdminTeamController::class, 'index'])
                ->name('v1.super_admin.admins.index');
            Route::post('/admins/invite', [SuperAdminTeamController::class, 'invite'])
                ->name('v1.super_admin.admins.invite');
            Route::get('/admins/invitations', [SuperAdminTeamController::class, 'pendingInvitations'])
                ->name('v1.super_admin.admins.invitations');
            Route::delete('/admins/{user}', [SuperAdminTeamController::class, 'destroy'])
                ->name('v1.super_admin.admins.destroy');

            // Settings
            Route::get('/settings', [SuperAdminSettingsController::class, 'show'])
                ->name('v1.super_admin.settings.show');
            Route::patch('/settings', [SuperAdminSettingsController::class, 'update'])
                ->name('v1.super_admin.settings.update');
        });
    });

    // --- Restaurant-owner self-service (Phase 2 — branding + custom domains) ---
    // Guards `/api/v1/admin/*` with `tenant.admin`: requires Sanctum auth +
    // owner/manager role + non-null tenant_id. Per-resource policies further
    // restrict write actions on custom domains to owners only.
    Route::middleware(['auth:sanctum', 'tenant.admin'])->prefix('admin')->group(function () {
        // Brand management
        Route::get('/brand', [AdminBrandController::class, 'show'])
            ->name('v1.admin.brand.show');
        Route::patch('/brand', [AdminBrandController::class, 'update'])
            ->name('v1.admin.brand.update');
        Route::post('/brand/logo', [AdminBrandController::class, 'uploadLogo'])
            ->name('v1.admin.brand.logo.upload');
        Route::post('/brand/cover', [AdminBrandController::class, 'uploadCover'])
            ->name('v1.admin.brand.cover.upload');
        Route::post('/brand/hero', [AdminBrandController::class, 'uploadHero'])
            ->name('v1.admin.brand.hero.upload');
        Route::post('/brand/favicon', [AdminBrandController::class, 'uploadFavicon'])
            ->name('v1.admin.brand.favicon.upload');

        // Custom domain management
        Route::get('/domains', [AdminDomainController::class, 'index'])
            ->name('v1.admin.domains.index');
        Route::post('/domains', [AdminDomainController::class, 'store'])
            ->name('v1.admin.domains.store');
        Route::get('/domains/{domain}', [AdminDomainController::class, 'show'])
            ->name('v1.admin.domains.show');
        Route::post('/domains/{domain}/verify', [AdminDomainController::class, 'verify'])
            ->name('v1.admin.domains.verify');
        Route::post('/domains/{domain}/set-primary', [AdminDomainController::class, 'setPrimary'])
            ->name('v1.admin.domains.set_primary');
        Route::delete('/domains/{domain}', [AdminDomainController::class, 'destroy'])
            ->name('v1.admin.domains.destroy');

        // Tier-aware feature flags
        Route::get('/tier-features', [AdminTierFeatureController::class, 'show'])
            ->name('v1.admin.tier_features');

        // --- Phase 3 — White-label native apps (Enterprise tier) ---
        // Tier check happens both inside the FormRequest (CreateAppRequest)
        // and in GenerateNativeAppAction so the Filament UI and any
        // direct API caller cannot bypass the gate.
        Route::get('/apps', [AdminAppController::class, 'index'])
            ->name('v1.admin.apps.index');
        Route::post('/apps', [AdminAppController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('v1.admin.apps.store');
        Route::get('/apps/{app}', [AdminAppController::class, 'show'])
            ->name('v1.admin.apps.show');
        Route::patch('/apps/{app}', [AdminAppController::class, 'update'])
            ->name('v1.admin.apps.update');
        Route::delete('/apps/{app}', [AdminAppController::class, 'destroy'])
            ->name('v1.admin.apps.destroy');

        // Build dispatch is rate-limited because every call costs an EAS
        // build minute. 10/min is generous for an owner double-clicking;
        // GenerateNativeAppAction additionally rejects concurrent builds.
        Route::post('/apps/{app}/build', [AdminAppController::class, 'build'])
            ->middleware('throttle:10,1')
            ->name('v1.admin.apps.build');

        Route::get('/apps/{app}/builds', [AdminAppController::class, 'builds'])
            ->name('v1.admin.apps.builds');
        Route::post('/apps/{app}/builds/{buildId}/cancel', [AdminAppController::class, 'cancelBuild'])
            ->name('v1.admin.apps.builds.cancel');

        // --- Phase 3 (D3) — Post-build store submission ---
        // submit: manual trigger (used by build_account=tenant flow + retries
        // after transient Apple/Google API failures).
        // qr: returns the install QR-code URL for TestFlight / Play Internal Testing.
        Route::post('/apps/{app}/builds/{buildId}/submit', [AdminBuildSubmissionController::class, 'submit'])
            ->middleware('throttle:10,1')
            ->name('v1.admin.apps.builds.submit');
        Route::get('/apps/{app}/builds/{buildId}/qr', [AdminBuildSubmissionController::class, 'qr'])
            ->name('v1.admin.apps.builds.qr');

        // --- Phase 4 (E2) — AI features (menu generator, translator, descriptions) ---
        // Tier gate (Pro+) is enforced by the FormRequest layer; per-tenant
        // daily quota is enforced by AiQuotaGuard inside the controller. The
        // throttle below is a safety net to absorb runaway bots — the real
        // cap is the daily-limit response (429) which the dashboard surfaces.
        Route::prefix('ai')->group(function () {
            Route::post('/menu/generate', [AdminAIController::class, 'generateMenu'])
                ->middleware('throttle:30,1')
                ->name('v1.admin.ai.menu.generate');
            Route::post('/translate', [AdminAIController::class, 'translate'])
                ->middleware('throttle:60,1')
                ->name('v1.admin.ai.translate');
            Route::post('/description', [AdminAIController::class, 'description'])
                ->middleware('throttle:60,1')
                ->name('v1.admin.ai.description');
            Route::get('/usage', [AdminAIController::class, 'usage'])
                ->name('v1.admin.ai.usage');

            // --- Phase 4 (E3) — Demand forecasting + AI insights -----------
            // Statistical forecasts (top items, low sellers, predict week)
            // are pure SQL — no AI cost. The Claude-narrated `insights`
            // endpoint burns ~2.3k tokens per call and is Enterprise-only.
            // Tier gates live in the FormRequest layer; throttles below
            // bound burst traffic (forecasts are cheap to recompute).
            Route::prefix('forecast')->group(function () {
                Route::get('/top-items', [AdminForecastController::class, 'topItems'])
                    ->middleware('throttle:120,1')
                    ->name('v1.admin.ai.forecast.top_items');
                Route::get('/predict-week', [AdminForecastController::class, 'predictWeek'])
                    ->middleware('throttle:60,1')
                    ->name('v1.admin.ai.forecast.predict_week');
                Route::get('/low-sellers', [AdminForecastController::class, 'lowSellers'])
                    ->middleware('throttle:120,1')
                    ->name('v1.admin.ai.forecast.low_sellers');
            });

            Route::post('/insights', [AdminInsightsController::class, 'store'])
                ->middleware('throttle:10,1')
                ->name('v1.admin.ai.insights');
        });
    });

    // --- Staff-mobile (PIN-authenticated) ---
    Route::middleware(['auth:sanctum', 'staff.scope'])->prefix('staff')->group(function () {
        Route::get('/me', [StaffMeController::class, 'show'])->name('v1.staff.me');

        Route::post('/clock-in', [StaffClockController::class, 'clockIn'])->name('v1.staff.clock_in');
        Route::post('/clock-out', [StaffClockController::class, 'clockOut'])->name('v1.staff.clock_out');

        Route::get('/shifts/current', [StaffShiftController::class, 'current'])->name('v1.staff.shifts.current');
        Route::get('/shifts', [StaffShiftController::class, 'index'])->name('v1.staff.shifts.index');

        Route::post('/breaks/start', [StaffBreakController::class, 'start'])->name('v1.staff.breaks.start');
        Route::post('/breaks/end', [StaffBreakController::class, 'end'])->name('v1.staff.breaks.end');

        Route::get('/orders/my', [StaffOrderController::class, 'myOrders'])->name('v1.staff.orders.my');
        Route::post('/orders', [StaffOrderController::class, 'store'])->name('v1.staff.orders.store');
        Route::patch('/orders/{order}/status', [StaffOrderController::class, 'updateStatus'])->name('v1.staff.orders.status');

        Route::get('/kitchen/queue', [StaffKitchenController::class, 'queue'])->name('v1.staff.kitchen.queue');
        Route::patch('/orders/{order}/items/{item}/status', [StaffKitchenController::class, 'updateItemStatus'])
            ->name('v1.staff.kitchen.item_status');

        Route::get('/stats', [StaffStatsController::class, 'show'])->name('v1.staff.stats');

        // --- Courier sub-API ---
        Route::prefix('courier')->group(function () {
            Route::get('/available', [CourierAvailableController::class, 'index'])
                ->name('v1.staff.courier.available');
            Route::get('/active', [CourierActiveController::class, 'show'])
                ->name('v1.staff.courier.active');
            Route::get('/history', [CourierHistoryController::class, 'index'])
                ->name('v1.staff.courier.history');
            Route::get('/earnings', [CourierEarningsController::class, 'show'])
                ->name('v1.staff.courier.earnings');

            Route::post('/orders/{order}/accept', [CourierAcceptController::class, 'accept'])
                ->name('v1.staff.courier.accept');
            Route::post('/orders/{order}/pickup', [CourierPickupController::class, 'pickup'])
                ->name('v1.staff.courier.pickup');
            Route::post('/orders/{order}/deliver', [CourierDeliverController::class, 'deliver'])
                ->name('v1.staff.courier.deliver');
            Route::post('/orders/{order}/cancel', [CourierCancelController::class, 'cancel'])
                ->name('v1.staff.courier.cancel');

            // Hot path — throttled to 120 req/min (every ~0.5s).
            Route::post('/location', [CourierLocationController::class, 'store'])
                ->middleware('throttle:120,1')
                ->name('v1.staff.courier.location');
        });
    });
});
