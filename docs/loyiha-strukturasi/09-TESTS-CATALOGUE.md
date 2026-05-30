# 🧪 TESTS — TO'LIQ KATALOG

> Manba: `apps/api/tests/` — **88 ta Pest test** + 2 setup
> Framework: **Pest 3.8** + PHPUnit 11.5 underlying
> Frontend: **Vitest 2.1** (web-marketing + mobile-consumer)
> Coverage target: **80%** (CLAUDE.md §6)

---

## 📊 STATISTIKA

| Layer | Test count | Tool |
|---|---|---|
| Backend Feature | **86** | Pest |
| Backend Unit | 1 | Pest |
| Test setup | 2 (Pest.php, TestCase.php) | — |
| Web unit (web-marketing) | 1 (`onboarding-wizard.test.tsx`) | Vitest |
| Mobile unit (mobile-consumer) | 5 | Vitest |
| Web unit (web-consumer) | 5 | Vitest |
| **JAMI** | **~100** | Multi-stack |

---

## 🏛️ BACKEND PEST TESTS — 17 KATEGORIYA

### 1. `Admin/` (3 ta)
| Test | Tekshiradi |
|---|---|
| `BrandApiTest.php` | Brand CRUD + image upload |
| `DomainApiTest.php` | Custom domain create/verify/setPrimary |
| `TierFeaturesTest.php` | Tier capabilities matrix |

---

### 2. `AI/` (6 ta)
| Test | Tekshiradi |
|---|---|
| `AdminAiApiTest.php` | `/admin/ai/*` endpoints |
| `AnthropicClientTest.php` | Claude API client (HTTP mock) |
| `AutoTranslateTest.php` | UZ→RU/EN/KZ translation |
| `ChatbotTest.php` | Public chat — safety filter, conversation memory |
| `DemandForecastTest.php` | top_items, predict_week, low_sellers |
| `MenuGeneratorTest.php` | AI menu suggestion flow |

---

### 3. `App/` (9 ta — Phase 3 Native Apps)
| Test | Tekshiradi |
|---|---|
| `AdminAppApiTest.php` | TenantApp CRUD |
| `AppPolicyTest.php` | Policy enforcement |
| `EasBuildClientTest.php` | EAS API integration |
| `EasWebhookTest.php` | HMAC-SHA1 webhook signature |
| `EnumsTest.php` | AppPlatform/AppStatus/BuildStatus/SubmissionStatus |
| `GenerateBuildTest.php` | DispatchEasBuildJob flow |
| `SubmitToStoreTest.php` | Store submission pipeline |
| `TenantAppModelTest.php` | Model relations + builders |
| `TierGatingTest.php` | Plus+ tier gating |

---

### 4. `Domain/` (3 ta — Custom domains)
| Test | Tekshiradi |
|---|---|
| `DomainVerificationTest.php` | DNS TXT/CNAME verification |
| `ResolveTenantFromDomainTest.php` | Middleware host → tenant |
| `TenantDomainModelTest.php` | Model + soft deletes |

---

### 5. `Internal/` (1 ta)
| Test | Tekshiradi |
|---|---|
| `CaddyVerifyTest.php` | TLS on-demand verify endpoint |

---

### 6. `Migration/` (3 ta — Schema regression)
| Test | Tekshiradi |
|---|---|
| `Phase2SchemaTest.php` | tenant_domains + tenant_brands |
| `Phase3SchemaTest.php` | tenant_apps + tenant_app_builds |
| `Phase4SchemaTest.php` | countries, currencies, exchange_rates, ai_generations_log |

---

### 7. `Money/` (3 ta — Phase 4)
| Test | Tekshiradi |
|---|---|
| `CurrencyFormatterTest.php` | `formatUZS()`, decimals handling |
| `FxRateServiceTest.php` | Rate provider fallback chain (CBU → NBP → NBKR → Fixer) |
| `MoneyValueObjectTest.php` | Money immutable, arithmetic |

---

### 8. `Payment/` (1 ta — Webhook security)
| Test | Tekshiradi |
|---|---|
| `WebhookStubBypassTest.php` | Stub-mode reject in production |

---

### 9. `Performance/` (3 ta — Phase 0)
| Test | Tekshiradi |
|---|---|
| `CacheLayerTest.php` | Redis cache hits, TTL |
| `EagerLoadingTest.php` | N+1 prevention |
| `PartitioningTest.php` | courier_locations partition routing |

---

### 10. `Public/` (3 ta)
| Test | Tekshiradi |
|---|---|
| `PublicMenuCacheTest.php` | ETag + Redis 1h cache |
| `PublicOrderTest.php` | Guest checkout (5/min throttle) |
| `PublicRestaurantApiTest.php` | Marketplace listing |

---

### 11. `Region/` (1 ta — Phase 4)
| Test | Tekshiradi |
|---|---|
| `CountryCurrencyTest.php` | Country↔Currency FK consistency |

---

### 12. `Reverb/` (2 ta — Real-time)
| Test | Tekshiradi |
|---|---|
| `ChannelAuthTest.php` | 4 ta kanal auth qoidalari |
| `EventBroadcastTest.php` | 6 ta event broadcastWith() payload |

---

### 13. `Security/` (7 ta — Phase 0)
| Test | Tekshiradi |
|---|---|
| `BelongsToTenantScopeTest.php` | Eloquent global scope tenant filtering |
| `PaymentWebhookBypassTest.php` | IP allowlist + signature check |
| `PiiEncryptionTest.php` | 8 ta encrypted ustun + decryption |
| `PolicyEnforcementTest.php` | 18 ta Policy methods |
| `SecurityAuditRegressionTest.php` | OWASP Top 10 regression |
| `TenantIsolationRlsTest.php` | PostgreSQL RLS — DB-level isolation |
| `TokenAbilityTest.php` | Sanctum token scopes |

---

### 14. `V1/Auth/` (2 ta)
| Test | Tekshiradi |
|---|---|
| `LoginTest.php` | `/auth/login` (10/min throttle) |
| `MeTest.php` | `/auth/me` |

---

### 15. `V1/Kiosk/` (6 ta)
| Test | Tekshiradi |
|---|---|
| `HeartbeatTest.php` | Live status update |
| `MenuTest.php` | Menu sync |
| `OrderStatusTest.php` | Order status polling |
| `PairTest.php` | Pairing code → device token |
| `PaymentTest.php` | Payment intent + capture |
| `PlaceOrderTest.php` | Order create flow |

---

### 16. `V1/Menu/` (2 ta)
| Test | Tekshiradi |
|---|---|
| `MenuCategoryTest.php` | Categories CRUD |
| `MenuItemTest.php` | Items CRUD + i18n + allergens |

---

### 17. `V1/Notification/` (1 ta)
| Test | Tekshiradi |
|---|---|
| `NotificationChannelTest.php` | 5 driver behavior + preferences |

---

### 18. `V1/Order/` (2 ta)
| Test | Tekshiradi |
|---|---|
| `CreateOrderTest.php` | Order create (dine_in, delivery, kiosk) |
| `OrderStatusTest.php` | Status transitions (FSM) |

---

### 19. `V1/Payment/` (2 ta)
| Test | Tekshiradi |
|---|---|
| `CashCaptureTest.php` | Cash payment flow |
| `CreateIntentTest.php` | Click/Payme intent creation |

---

### 20. `V1/Staff/` (6 ta)
| Test | Tekshiradi |
|---|---|
| `BreakTest.php` | Start/end break |
| `ClockInOutTest.php` | Time tracking |
| `ItemStatusTest.php` | Kitchen item status update |
| `KitchenQueueTest.php` | Cook queue feed |
| `MyOrdersTest.php` | Waiter's own orders |
| `StaffLoginTest.php` | PIN login + brute-force protection |

---

### 21. `V1/Staff/Courier/` (9 ta — All courier sub-API)
| Test | Tekshiradi |
|---|---|
| `AcceptDeliveryTest.php` | Accept order |
| `ActiveDeliveryTest.php` | Current delivery |
| `AvailableOrdersTest.php` | Available pool |
| `CancelTest.php` | Cancel delivery |
| `DeliverTest.php` | Mark delivered |
| `EarningsTest.php` | Earnings calculation |
| `HistoryTest.php` | Past deliveries |
| `LocationUpdateTest.php` | GPS update (120/min throttle) |
| `PickupTest.php` | Pickup confirm |

---

### 22. `V1/SuperAdmin/` (8 ta)
| Test | Tekshiradi |
|---|---|
| `AuditLogTest.php` | Audit log filters + actions |
| `BillingTest.php` | MRR breakdown, subscriptions |
| `DashboardTest.php` | KPIs + charts |
| `ImpersonateTest.php` | Tenant impersonation flow |
| `LoginTest.php` | Super-admin login (20/15min throttle) |
| `MeTest.php` | `/me` endpoint |
| `SettingsTest.php` | Global settings update |
| `TeamTest.php` | Invite/accept/revoke admins |
| `TenantTest.php` | Tenant CRUD |

---

### 23. `V1/Table/` (1 ta)
| Test | Tekshiradi |
|---|---|
| `TableTest.php` | Table CRUD + status update |

---

### 24. `V1/Webhook/` (2 ta)
| Test | Tekshiradi |
|---|---|
| `ClickWebhookTest.php` | Click signature + IP allowlist |
| `PaymeWebhookTest.php` | Payme JSON-RPC + signature |

---

### 25. `Unit/` (1 ta)
| Test | Tekshiradi |
|---|---|
| `OrderStatusTransitionTest.php` | FSM (pending → preparing → ready → served → completed) |

---

## 📐 TEST STRUCTURE PATTERN

### Pest expectation example
```php
test('owner can create order', function () {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->create(['tenant_id' => $tenant->id]);
    $owner->assignRole(Role::Owner->value);

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/v1/orders', [
        'type' => 'dine_in',
        'table_id' => $table->id,
        'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'order_no', 'status']]);

    expect(Order::query()->count())->toBe(1);
});
```

### Factory chain
```php
$order = Order::factory()
    ->for($tenant)
    ->for($table)
    ->has(OrderItem::factory()->count(3))
    ->create();
```

---

## 🔍 PEST.PHP KONFIGURATSIYA

**File:** `tests/Pest.php`

Asosiy directives:
```php
uses(Tests\TestCase::class)->in('Feature', 'Unit');

// Custom expectations
expect()->extend('toBeMoney', fn () => $this->toBeInstanceOf(Money::class));

// Global setup/teardown
beforeEach(function () { /* RLS context, factory state */ });
```

---

## 📦 FRONTEND TESTLAR

### `apps/web-marketing/src/__tests__/`
- `onboarding-wizard.test.tsx` — 5-step wizard form validation

### `apps/web-consumer/src/__tests__/`
- `brand-context.test.tsx` — Tenant brand provider
- `i18n-kz.test.ts` — Kazakh locale strings
- `order-flow.test.tsx` — Cart → checkout → success
- `restaurants.test.tsx` — Marketplace list
- `theme-modern.test.tsx` — ModernTheme rendering

### `apps/mobile-consumer/src/__tests__/`
- `api.test.ts` — API client mappers

### `apps/mobile-consumer/__mocks__/`
- `expo-secure-store.ts`
- `laravel-echo.ts`
- `pusher-js.ts`
- `react-native.ts`

---

## 🎯 COVERAGE STRATEGIYA (CLAUDE.md §6)

**Target:** 80%+ each layer

### Backend (Pest)
- Feature tests: ~86 — barcha API endpointlar
- Unit tests: 1 (OrderStatusTransition)
- Coverage tool: `vendor/bin/pest --coverage`

### Frontend (Vitest)
- Setup: `vitest.config.ts`
- Coverage: `@vitest/coverage-v8`
- Run: `pnpm test`

### E2E
- **Web:** Playwright (configured emas yet)
- **Mobile:** Maestro (configured emas yet)

---

## 🧪 TEST GROUPS BO'YICHA TAQSIMOT

```
Feature Tests Distribution (86 ta):

V1 endpoints:           ~50 ta  (58%)
Security:                7 ta   (8%)
Admin (brand/domain):    3 ta   (3%)
AI:                      6 ta   (7%)
App (Phase 3):           9 ta   (10%)
Money/Region:            4 ta   (5%)
Migration regression:    3 ta   (3%)
Performance:             3 ta   (3%)
Public:                  3 ta   (3%)
Reverb:                  2 ta   (2%)
Other:                   3 ta   (3%)
```

---

## 🏃 TEST IShGA TUSHIRISH

```bash
# Backend — barcha testlar
cd apps/api && composer test

# Backend — Pest filter
vendor/bin/pest --filter=OrderStatus

# Backend — coverage
vendor/bin/pest --coverage --min=80

# Backend — parallel (4 worker)
vendor/bin/pest --parallel --processes=4

# Frontend — vitest
cd apps/web-marketing && pnpm test
cd apps/mobile-consumer && pnpm test

# Monorepo barcha testlar
pnpm test
```

---

## 📋 TEST WRITING CONVENTIONS

### Naming
- `tests/Feature/V1/<Domain>/<Verb><Subject>Test.php`
- E.g. `tests/Feature/V1/Order/CreateOrderTest.php`

### Test descriptions
- Pest: `test('owner can ...', function () { ... });`
- Yoki: `it('rejects invalid status', function () { ... });`

### Assertions
- `$response->assertOk()` / `assertCreated()` / `assertForbidden()`
- `$response->assertJsonStructure(['data' => [...]])`
- `expect($model->status)->toBe('preparing')`
- `expect($collection)->toHaveCount(3)`

### Database
- `RefreshDatabase` trait (in TestCase)
- Factory + relationships
- RLS context — `actingAs()` + `SetTenantContext` middleware

---

> Yangilangan: 2026-05-03 · Manba: 88 Pest tests + 2 setup + 11 frontend tests
