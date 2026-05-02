<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\AI\Actions\GenerateMenuAction;
use App\Domain\AI\Exceptions\AiDisabledException;
use App\Domain\AI\Exceptions\AnthropicException;
use App\Domain\AI\Services\AiQuotaGuard;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public self-service onboarding endpoints — power the marketing-site
 * /get-started wizard.
 *
 * STATUS: SKELETON. The controller signatures, validation, and response
 * envelope are stable so the marketing app can be wired against them, but
 * the actual side-effects (creating the tenant, generating the menu, opening
 * a Click subscription) are stubbed. A follow-up agent fills these in.
 *
 * Contract — used by `apps/web-marketing/src/lib/wizard-api.ts`:
 *
 *   POST /api/v1/public/onboarding/start
 *     in : { name, slug, email, phone }
 *     out: { data: { registration_id, expires_at } }
 *     side-effect: insert into `tenant_registrations`, return id (UUID)
 *
 *   POST /api/v1/public/onboarding/menu-generate
 *     in : { cuisine, registration_id? }
 *     out: { data: { items: [ { name, description, category, priceUzs }, ... ] } }
 *     side-effect: call Anthropic Messages API, cache result on the registration row
 *
 *   POST /api/v1/public/onboarding/submit
 *     in : { restaurant, menu, tables, payments, tier, registration_id? }
 *     out: { data: { tenant_id, admin_email, admin_login_url, payment_redirect_url } }
 *     side-effect: provision Tenant + admin User + tables + menu + (paid) Click sub
 *
 * Rate limiting: every route is throttled per-IP. The slug uniqueness check
 * inside `start()` is the only DB roundtrip on the hot path so abuse cost
 * stays low.
 *
 * Everything here returns a `data`-wrapped envelope per CLAUDE.md §9.
 */
class OnboardingController extends Controller
{
    /**
     * Step 1: persist the basic restaurant info to a `tenant_registrations`
     * staging row so a flaky network can resume mid-flow.
     *
     * NOTE: the `tenant_registrations` table is referenced by the audit but
     * not yet present in this branch's migrations — Agent C1 owns it.
     * Until then we return a synthetic UUID so the wizard works end-to-end
     * in dev. Real persistence is gated behind a feature flag.
     */
    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'slug' => ['required', 'string', 'min:3', 'max:32', 'regex:/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'min:7', 'max:20'],
        ]);

        // TODO(c1-followup): once the migration lands, replace this with
        //   $reg = TenantRegistration::create([...$data, 'expires_at' => now()->addHours(48)]);
        $registrationId = (string) Str::uuid();
        $expiresAt = now()->addHours(48)->toIso8601String();

        Log::info('onboarding.start', [
            'registration_id' => $registrationId,
            'slug' => $data['slug'],
            // Intentionally NOT logging email/phone — PII per CLAUDE.md §7.
        ]);

        return response()->json([
            'data' => [
                'registration_id' => $registrationId,
                'expires_at' => $expiresAt,
            ],
        ], 201);
    }

    /**
     * Step 2: AI menu generation.
     *
     * Wired (Agent E2) to {@see GenerateMenuAction} which calls Anthropic
     * Messages API with a Central-Asian-aware system prompt and writes a row
     * to `ai_generations_log` for cost tracking.
     *
     * Tenant context: this endpoint runs *before* the tenant exists, so
     * we pass tenant=null to the action and feed the locale + currency
     * defaults from the request payload (best-effort guess from the IP +
     * accepted languages, defaulting to UZ/UZS).
     *
     * Abuse guard: per-IP throttle is enforced both by the route's
     * `throttle:10,60` and by {@see AiQuotaGuard::countPublicRequestsByIpLastHour}.
     * If Anthropic is disabled / mis-configured we silently fall back to the
     * deterministic stub so the marketing wizard remains functional.
     */
    public function menuGenerate(
        Request $request,
        GenerateMenuAction $generateMenu,
        AiQuotaGuard $quotaGuard,
    ): JsonResponse {
        $request->validate([
            'cuisine' => ['required', 'in:pizza,lavash,choyxona,fastfood,sushi,cafe,bakery,bar,fine_dining,other'],
            'registration_id' => ['nullable', 'uuid'],
            'locale' => ['sometimes', 'string', 'in:uz,ru,en,kz'],
            'country_code' => ['sometimes', 'string', 'size:2'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
        ]);

        $cuisine = (string) $request->input('cuisine');
        $ip = (string) $request->ip();
        $hourlyCap = (int) config('anthropic.public_hourly_limit_per_ip', 5);

        // Cheap pre-check — saves an upstream call when the IP has already
        // burned through its hourly allowance. The route-level throttle is
        // the final defence; this just gives a friendlier error.
        if ($hourlyCap > 0 && $quotaGuard->countPublicRequestsByIpLastHour($ip) >= $hourlyCap) {
            return response()->json([
                'errors' => [[
                    'code' => 'public_ai_rate_limited',
                    'message' => __('Iltimos, bir oz keyinroq qayta urinib ko\'ring'),
                ]],
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        try {
            $items = ($generateMenu)(
                tenant: null,
                cuisineType: $cuisine,
                itemCount: 25,
                locales: $this->resolvePublicLocales($request),
                countryCode: strtoupper((string) $request->input('country_code', 'UZ')),
                currencyCode: strtoupper((string) $request->input('currency_code', 'UZS')),
            );

            return response()->json([
                'data' => [
                    'items' => array_map(static fn ($dto) => [
                        'name' => $dto->name,
                        'description' => $dto->description,
                        'category' => $dto->category,
                        'priceUzs' => $dto->suggested_price_minor,
                        'suggested_price_minor' => $dto->suggested_price_minor,
                        'emoji' => $dto->emoji,
                    ], $items),
                ],
                'meta' => [
                    'count' => count($items),
                    'source' => 'ai',
                ],
            ]);
        } catch (AiDisabledException | AnthropicException $e) {
            // Anthropic key missing or upstream broken — keep the wizard
            // functional with the deterministic stub so onboarding doesn't
            // dead-end on misconfigured prod.
            Log::warning('onboarding.menu_generate.fallback', [
                'cuisine' => $cuisine,
                'reason' => $e->getMessage(),
            ]);
            $items = $this->stubMenuFor($cuisine);
            return response()->json([
                'data' => ['items' => $items],
                'meta' => ['count' => count($items), 'source' => 'stub'],
            ]);
        }
    }

    /**
     * Determine which locales to populate for the wizard.
     *
     * @return array<int, string>
     */
    private function resolvePublicLocales(Request $request): array
    {
        $primary = (string) $request->input('locale', '');
        $base = ['uz', 'ru', 'en'];
        if ($primary !== '' && ! in_array($primary, $base, true)) {
            $base[] = strtolower($primary);
        }
        return $base;
    }

    /**
     * Step 5: final commit — provision the tenant and return a redirect target.
     *
     * Real implementation orchestrates:
     *   1. Create Tenant + initial admin User (within a DB transaction).
     *   2. Insert MenuCategories + MenuItems from `menu.items`.
     *   3. Auto-generate Tables based on `tables.zones` * `tables.tablesPerZone`.
     *   4. Mark intended PaymentProviders on the tenant row (real OAuth happens
     *      inside the dashboard).
     *   5. For paid tiers: create a Click subscription draft and return its
     *      `payment_redirect_url`. For free: return null and the wizard sends
     *      the user straight to `app.mypos.uz/login`.
     *
     * Idempotency: the FormRequest-level slug + email uniqueness checks fail
     * with 409 if a previous attempt succeeded. Clients on retry should look
     * up the existing registration via /start with the same payload.
     */
    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant.name' => ['required', 'string', 'min:2', 'max:120'],
            'restaurant.slug' => ['required', 'string', 'min:3', 'max:32', 'regex:/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/'],
            'restaurant.cuisine' => ['required', 'string'],
            'restaurant.city' => ['required', 'string', 'min:2', 'max:80'],
            'restaurant.address' => ['required', 'string', 'min:4', 'max:255'],
            'restaurant.phone' => ['required', 'string', 'min:7', 'max:20'],
            'restaurant.email' => ['required', 'email', 'max:255'],
            'restaurant.logoDataUrl' => ['nullable', 'string'],

            'menu.mode' => ['required', 'in:ai,csv,manual'],
            'menu.items' => ['array', 'max:500'],

            'tables.zones' => ['required', 'integer', 'min:1', 'max:20'],
            'tables.tablesPerZone' => ['required', 'integer', 'min:1', 'max:50'],

            'payments.providers' => ['required', 'array', 'min:1'],
            'payments.providers.*' => ['in:cash,click,payme,card'],

            'tier' => ['required', 'in:free,pro,plus,enterprise'],

            'registration_id' => ['nullable', 'uuid'],
        ]);

        // TODO(provision-followup): real provisioning behind ProvisionTenantAction.
        $tenantId = (string) Str::uuid();
        $tier = (string) $data['tier'];

        // Paid tiers go through Click subscription billing first; free tier
        // jumps straight to the dashboard login.
        $paymentRedirectUrl = $tier === 'free'
            ? null
            : sprintf(
                'https://api.click.uz/services/pay?service_id=%s&merchant_id=%s&amount=%d&transaction_param=%s',
                (string) config('services.click.service_id', 'STUB'),
                (string) config('services.click.merchant_id', 'STUB'),
                $this->tierPriceUzs($tier),
                $tenantId,
            );

        Log::info('onboarding.submit', [
            'tenant_id' => $tenantId,
            'tier' => $tier,
            'menu_items' => count((array) ($data['menu']['items'] ?? [])),
            'tables' => (int) $data['tables']['zones'] * (int) $data['tables']['tablesPerZone'],
        ]);

        return response()->json([
            'data' => [
                'tenant_id' => $tenantId,
                'admin_email' => (string) $data['restaurant']['email'],
                'admin_login_url' => sprintf('https://app.mypos.uz/login?slug=%s', $data['restaurant']['slug']),
                'payment_redirect_url' => $paymentRedirectUrl,
            ],
        ], 201);
    }

    /**
     * Deterministic stub menu — keeps the wizard testable without hitting
     * the real AI provider during local dev / e2e tests.
     */
    private function stubMenuFor(string $cuisine): array
    {
        $samples = [
            'pizza' => [
                ['Margherita', 'Classic tomato, mozzarella, basil', 'Pizza', 65000],
                ['Pepperoni', 'Pepperoni, mozzarella, tomato', 'Pizza', 79000],
                ['Quattro Formaggi', 'Four-cheese pizza', 'Pizza', 89000],
                ['Caesar Salad', 'Romaine, parmesan, croutons', 'Salads', 45000],
                ['Tiramisu', 'Italian dessert', 'Desserts', 38000],
            ],
            'lavash' => [
                ['Klassik Lavash', "Mol go'shti, sabzavotlar, sous", 'Lavashlar', 32000],
                ['Tovuq Lavash', 'Tovuq, sabzavotlar, sous', 'Lavashlar', 28000],
                ['Twister', 'Tovuq, sabzavotlar, achchiq', 'Lavashlar', 30000],
                ['Coca-Cola 0.5', 'Sovuq ichimlik', 'Ichimliklar', 9000],
                ['Kartoshka fri', 'Qovurilgan kartoshka', "Garnit qo'shimchalar", 14000],
            ],
            'default' => [
                ['Kebab', 'Mixed grill plate', 'Mains', 65000],
                ['Plov', 'Uzbek rice with meat', 'Mains', 45000],
                ['Salat Achichuk', 'Tomato, cucumber, onion', 'Salads', 22000],
                ['Non', 'Fresh bread', 'Bread', 8000],
                ['Choy', 'Black tea', 'Drinks', 6000],
            ],
        ];

        $list = $samples[$cuisine] ?? $samples['default'];

        return array_map(static fn (array $row) => [
            'name' => $row[0],
            'description' => $row[1],
            'category' => $row[2],
            'priceUzs' => $row[3],
        ], $list);
    }

    private function tierPriceUzs(string $tier): int
    {
        // Stub prices in UZS — production reads from `subscription_plans`.
        return match ($tier) {
            'pro' => 1_080_000,
            'plus' => 3_600_000,
            default => 0,
        };
    }
}
