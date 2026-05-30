# 🔗 ELOQUENT MODELS — RELATIONS + PROPERTIES

> Manba: `apps/api/app/Domain/*/Models/` + `apps/api/app/Models/User.php`
> Jami: **34 ta Eloquent model**
> Multi-tenancy: `BelongsToTenant` trait (28 ta modelda)
> PII: `encrypted` cast (8 ustun, 3 ta modelda)

---

## 📊 STATISTIKA

| Element | Soni |
|---|---|
| Jami modellar | **34** |
| `BelongsToTenant` ishlatadiganlar | 28 |
| Tenant-scopedan tashqari (global) | 6 |
| `SoftDeletes` ishlatadiganlar | 14 |
| `HasUuids` ishlatadiganlar | ~30 |
| `HasFactory` ishlatadiganlar | ~17 |
| Encrypted PII fields | 8 |
| Translatable jsonb fields | 12+ |
| Money cast (Phase 4) | 8 virtual props |

---

## 🤖 AI Domain

### `AiGenerationLog` (`app/Domain/AI/Models/AiGenerationLog.php`)
**Table:** `ai_generations_log`
**Traits:** BelongsToTenant, HasUuids
**Fillable:** tenant_id, user_id, feature, model, input_tokens, output_tokens, cost_usd, status, error_message, duration_ms, request_payload, response_payload, ip_address
**Casts:**
- feature → AiFeature enum
- status → AiGenerationStatus enum
- input/output_tokens → integer
- cost_usd → float
- duration_ms → integer
- request_payload, response_payload → array

**Relations:**
- `user()` → belongsTo User (user_id)
- `tenant()` → BelongsTo Tenant (via trait)

**Methods:** `totalTokens(): int` — input + output

---

## 👥 Customer Domain

### `Customer` 🔒 PII
**Table:** `customers`
**Traits:** HasFactory, HasUuids, BelongsToTenant, SoftDeletes
**Fillable:** tenant_id, phone, phone_index, email, first_name, last_name, birthday, locale, gender, avatar_url, tags, notes, total_orders, total_spent, last_visit_at
**Encrypted PII:** **phone, email, notes** (Crypt::encryptString)
**Casts:**
- tags → array
- birthday → date
- last_visit_at → datetime
- total_orders/spent → integer
- phone, email, notes → encrypted

**Relations:**
- `loyaltyAccount()` → hasOne LoyaltyAccount (customer_id)

**Methods:**
- `fullName(): string`
- `hasTag(string): bool`
- `normalizePhone(string): string` static
- `hashPhone(string): string` static — HMAC-SHA256
- `scopeWherePhone(Builder, string): Builder` — Lookup via phone_index

### `LoyaltyAccount`
**Traits:** HasUuids, BelongsToTenant
**Fillable:** tenant_id, customer_id, program_id, tier, points_balance, lifetime_points
**Relations:**
- `customer()` → belongsTo Customer
- `program()` → belongsTo LoyaltyProgram
- `transactions()` → hasMany LoyaltyTransaction

### `LoyaltyProgram`
**Translatable name** (jsonb)
**Relations:**
- `accounts()` → hasMany LoyaltyAccount

**Methods:**
- `name(string $locale = 'uz'): string`
- `pointsForSpend(int $amount): int`

### `LoyaltyTransaction` — Append-only
**Timestamps:** created_at only
**Relations:**
- `account()` → belongsTo LoyaltyAccount
- `order()` → belongsTo Order

---

## 👨‍🍳 Employee Domain

### `Employee`
**Traits:** HasFactory, HasUuids, BelongsToTenant, SoftDeletes
**Fillable:** tenant_id, user_uuid, employee_code, position, hire_date, base_salary, hourly_rate, status, pin_code_hash, pin_set_at, last_clock_in_at, terminated_at, notes, emergency_contact, documents
**Casts:** hire_date → date, base/hourly → integer, pin_set_at, last_clock_in_at, terminated_at → datetime, documents → array

**Relations:**
- `user()` → belongsTo User (user_uuid, 'uuid') — ⚠️ FK on non-PK column
- `shifts()` → hasMany Shift
- `breaks()` → hasMany ShiftBreak
- `clockEvents()` → hasMany TimeClockEvent
- `latestShift()` → hasMany Shift (DESC)

**Methods:** `isActive(): bool`

### `Shift`
**Relations:**
- `employee()` → belongsTo Employee
- `clockEvents()` → hasMany TimeClockEvent
- `breaks()` → hasMany ShiftBreak

**Methods:** `workedMinutes(): int` — actual_end - actual_start

### `ShiftBreak`
**Relations:** `shift()`, `employee()`
**Methods:** `isOpen(): bool` — ended_at is null

### `TimeClockEvent` — Append-only
**Timestamps:** created_at only (UPDATED_AT = null)
**Relations:** `employee()`, `shift()` (nullable)

### `CourierLocation` — Partitioned table
**Casts:** lat → decimal:7, lng → decimal:7, accuracy_meters → decimal:2, heading → decimal:2, speed_mps → decimal:2, recorded_at → datetime
**Relations:** `employee()`, `order()` (nullable)

---

## 📦 Inventory Domain

### `Ingredient`
**Translatable name** (jsonb)
**Casts:**
- name → array (translatable)
- metadata → array
- is_active → boolean
- cost_per_unit → integer
- current_stock, min_stock, reorder_point → decimal:3

**Relations:**
- `category()` → belongsTo IngredientCategory (nullable)
- `movements()` → hasMany StockMovement
- `recipes()` → hasMany Recipe

**Methods:**
- `name(string $locale = 'uz'): string`
- `scopeLowStock(Builder): Builder` — current_stock ≤ min_stock
- `isLowStock(): bool`

### `IngredientCategory`
**Translatable name**
**Methods:** `name(string $locale = 'uz'): string`

### `Recipe` — Many-to-many menu↔ingredients
**Relations:**
- `menuItem()` → belongsTo MenuItem
- `ingredient()` → belongsTo Ingredient

### `StockMovement` — Append-only
**Timestamps:** created_at + recorded_at (no updated_at)
**Methods:** `reasonEnum(): ?StockMovementReason`

### `Supplier`
**Traits:** HasFactory, HasUuids, BelongsToTenant, SoftDeletes
**No relations defined**

---

## 🏪 Kiosk Domain

### `KioskDevice`
**Relations:**
- `tenant()` → belongsTo Tenant
- `orders()` → hasMany Order (kiosk_device_id)

**Methods:** `hashToken(string): string` static — SHA-256 (NOT bcrypt — fast lookups)

### `KioskPairingCode`
**Relations:**
- `tenant()` → belongsTo Tenant
- `device()` → belongsTo KioskDevice (nullable)
- `createdBy()` → belongsTo User (created_by_user_uuid, 'uuid')

**Methods:** `isUsable(): bool` — consumed_at null AND expires_at in future

---

## 🍽️ Menu Domain

### `MenuCategory`
**Translatable name** (jsonb)
**Relations:**
- `parent()` → belongsTo MenuCategory (parent_id, **self-referential**)
- `children()` → hasMany MenuCategory (parent_id, ordered by sort_order)
- `items()` → hasMany MenuItem

**Methods:** `name(string $locale = 'uz'): string`

### `MenuItem`
**Translatable** name + description (jsonb)
**Casts:** allergens, tags → array; bool flags; integer counts/prices
**Relations:**
- `category()` → belongsTo MenuCategory
- `recipes()` → hasMany Recipe

**Methods:**
- `name(string $locale = 'uz'): string`
- `description(string $locale = 'uz'): ?string`
- `effectivePrice(): int` — `price_amount * (100 - discount_percent) / 100`

---

## 🔔 Notification Domain

### `NotificationLog` 🔒 PII
**Encrypted PII:** **recipient, body**
**Casts:** metadata → array, sent/delivered_at → datetime

**Methods:**
- `markSent(?string $providerMessageId = null): void`
- `markFailed(string $error): void`
- `markDelivered(): void`
- `markRead(): void`

### `NotificationPreference`
**Traits:** HasUuids — ⚠️ NO BelongsToTenant (user-scoped)
**Relations:** `user()` → belongsTo User (user_uuid, 'uuid')
**Methods:** `isEnabled(string $userUuid, string $channel, string $template): bool` static

---

## 📦 Order Domain

### `Order` ⭐ ENG MURAKKAB
**Traits:** HasFactory, HasUuids, BelongsToTenant, SoftDeletes
**Encrypted PII:** delivery_address (JSON), delivery_phone, delivery_notes, customer_phone_for_receipt

**Fillable (47 ta ustun):** tenant_id, order_no, tracking_token, type, status, payment_status, payment_method, table_id, customer_id, employee_id, served_by_id, courier_id, guest_count, subtotal_amount, tax_amount, discount_amount, tip_amount, service_charge_amount, total_amount, paid_amount, currency, currency_code, notes, metadata, placed_at, prepared_at, served_at, paid_at, completed_at, cancelled_at, picked_up_at, delivering_at, delivered_at, delivery_distance_meters, delivery_fee_minor, courier_earnings_minor, delivery_address, delivery_phone, delivery_notes, kiosk_device_id, kiosk_session_id, customer_phone_for_receipt

**Phase 4 Money virtual casts (read-only):**
- `total_money` (pairs total_amount + currency_code)
- `subtotal_money`, `tax_money`, `discount_money`, `tip_money`, `service_charge_money`, `paid_money`

**Relations (7 ta):**
- `items()` → hasMany OrderItem
- `table()` → belongsTo Table (nullable)
- `employee()` → belongsTo User (employee_id, nullable) — order yaratuvchi
- `servedBy()` → belongsTo Employee (served_by_id, nullable) — waiter
- `courier()` → belongsTo Employee (courier_id, nullable)
- `customer()` → belongsTo Customer (nullable)
- `kioskDevice()` → belongsTo KioskDevice (nullable)

**Methods (Phase 4 multi-currency):**
- `effectiveCurrency(): string` — currency_code → currency → 'UZS' fallback
- `total(): Money` — Money value object
- `subtotal()`, `tax()`, `discount()`, `tip()`, `serviceCharge()`, `paid()` — Money objects
- `convertTotalTo(string, FxRateService): Money` — Convert at placed_at rate

### `OrderItem`
**Relations:**
- `order()` → belongsTo Order
- `menuItem()` → belongsTo MenuItem (nullable)
- `cook()` → belongsTo Employee (nullable)

---

## 💵 Payment Domain

### `Payment`
**Traits:** HasFactory, HasUuids, BelongsToTenant
**Phase 4 Money cast:** `amount_money` (pairs amount + currency_code)

**Relations:** `order()` → belongsTo Order

**Methods:**
- `providerEnum(): PaymentProvider`
- `statusEnum(): PaymentStatus`
- `effectiveCurrency(): string`
- `money(): Money`
- `convertTo(string, FxRateService): Money` — at captured_at | authorized_at | created_at fallback

---

## 🌍 Shared Domain (Global Lookups)

### `Country`
**PK:** `code` (string, non-incrementing) — ISO 3166-1 alpha-2
**Traits:** None (global lookup)
**Relations:** `currency()` → belongsTo Currency (currency_code, 'code')
**Methods:** `displayName(?string $locale = null): string` — locale → en → uz → first

### `Currency`
**PK:** `code` (string) — ISO 4217
**Translatable name**
**Methods:** `nameFor(string $locale): string`

### `ExchangeRate`
**PK:** `id` (bigint auto-increment)
**Timestamps:** created_at + fetched_at (no updated_at — append-only)
**Casts:** rate_date → date, fetched_at → datetime, **rate stays string** (precision)
**Relations:**
- `fromCurrency()` → belongsTo Currency (from_currency, 'code')
- `toCurrency()` → belongsTo Currency (to_currency, 'code')

**Convention:** rate = "1 from_currency = N to_currency"

---

## 🎛️ SuperAdmin Domain

### `AuditLog`
**Traits:** HasUuids — ⚠️ NO BelongsToTenant (cross-tenant)
**Timestamps:** created_at only (NEVER updated)
**Relations:**
- `tenant()` → belongsTo Tenant (nullable)
- `actor()` → belongsTo User (actor_user_uuid, 'uuid', nullable)

### `SuperAdminInvitation`
**Relations:**
- `invitedBy()` → belongsTo User
- `acceptedBy()` → belongsTo User (nullable)

**Methods:**
- `isPending(): bool` — accepted_at null AND revoked_at null AND expires_at in future
- `hashToken(string): string` static — SHA-256 (raw token emailed once)

---

## 🪑 Table Domain

### `Table`
**Relations:** `category()` → belongsTo TableCategory (nullable)
**Methods:** `isAvailable(): bool` — status === 'available'

### `TableCategory`
**Translatable name**
**Relations:** `tables()` → hasMany Table
**Methods:** `name(string $locale = 'uz'): string`

---

## 🏢 Tenant Domain

### `Tenant` ⭐ Multi-tenancy YADRO
**Traits:** HasFactory, HasUuids, SoftDeletes (NO BelongsToTenant — root)

**Fillable (~25):** slug, name, legal_name, plan, status, default_locale, default_currency, timezone, phone, email, logo_url, settings, trial_ends_at, suspended_at, subscription_plan, subscription_status, mrr_minor, subscription_ends_at, suspension_reason, last_active_at, total_orders_count, total_revenue_minor, notes, country_code, currency_code

**⚠️ NOT in fillable (mass-assignment guarding):**
- `tier`, `tier_started_at`, `tier_expires_at` — faqat `ChangeTenantTierAction::forceFill()` orqali
- `feature_flags` — faqat super-admin Actions

**Relations:**
- `users()` → hasMany User
- `brand()` → hasOne TenantBrand (lazy creation, may be null)
- `domains()` → hasMany TenantDomain
- `apps()` → hasMany TenantApp
- `country()` → belongsTo Country (country_code, 'code')
- `currency()` → belongsTo Currency (currency_code, 'code')

**Methods:**
- `isActive(): bool` — status === 'active' AND suspended_at null
- `canUseNativeApp(): bool` — TierFeatures::for($tier)->canUseNativeApp()
- `homeCurrency(): string` — currency_code → default_currency → UZS
- `zeroMoney(): Money` — for collection sum chains

### `TenantApp` — Phase 3 native apps
**Casts:**
- description → array (translatable)
- platform → AppPlatform enum (ios|android|universal)
- status → AppStatus enum
- screenshots → array
- submitted_at, approved_at → datetime

**Default attributes:**
- platform: 'universal'
- build_account: 'mypos'
- status: 'draft'

**Relations:**
- `tenant()` → belongsTo Tenant
- `builds()` → hasMany TenantAppBuild (DESC)
- `latestBuild()` → belongsTo TenantAppBuild (latest_build_id) — denormalized

**Methods:** `isBuildable(): bool` — icon_url AND bundle_id AND app_name set

### `TenantAppBuild`
**Default attributes:**
- status: 'queued'
- submission_status: 'pending'
- build_profile: 'production'

**Lifecycle:** queued → in_progress → finished | failed | errored | canceled

**Methods:**
- `isInFlight(): bool` — status in [queued, in_progress]
- `isTerminal(): bool` — status in [finished, failed, errored, canceled]
- `canBeSubmitted(): bool` — status===finished AND submission_status===pending

### `TenantBrand`
**PK:** `tenant_id` (1:1 with tenants)
**Translatable:** hero_title, hero_subtitle, tagline (jsonb)

### `TenantDomain`
**Default attributes:**
- is_primary: false
- is_verified: false
- verification_method: 'txt'
- ssl_status: 'pending'

**Lifecycle:** pending → provisioning → active | error

---

## 👤 App Models

### `User` (App\Models\User)
**Implements:** `FilamentUser`
**Traits:** HasFactory, HasApiTokens, HasRoles (Spatie), Notifiable, SoftDeletes

**Fillable:** uuid, tenant_id, name, email, phone, locale, avatar_url, password, is_super_admin, super_admin_role, last_super_admin_login_at, mfa_enabled, mfa_secret

**Hidden:** password, remember_token, mfa_secret

**Casts:**
- email_verified_at, last_login_at, last_super_admin_login_at → datetime
- is_super_admin, mfa_enabled → boolean
- password → hashed (Argon2id default)

**Booted:** Auto-generates UUID on creation if null

**Relations:** `tenant()` → belongsTo Tenant (nullable)

**Methods:**
- `canAccessPanel(Panel): bool` — Faqat super_admin Filament panel'ga kira oladi

**Observed by:** `UserSecurityObserver` (MFA, login tracking)

---

## 🔒 ENCRYPTION SUMMARY

| Model | Field | Cast |
|---|---|---|
| Customer | phone | `encrypted` |
| Customer | email | `encrypted` |
| Customer | notes | `encrypted` |
| Order | delivery_address | `encrypted:array` |
| Order | delivery_phone | `encrypted` |
| Order | delivery_notes | `encrypted` |
| Order | customer_phone_for_receipt | `encrypted` |
| NotificationLog | recipient | `encrypted` |
| NotificationLog | body | `encrypted` |

---

## 💰 MONEY CAST SUMMARY (Phase 4)

### Order
- `total_money`, `subtotal_money`, `tax_money`, `discount_money`, `tip_money`, `service_charge_money`, `paid_money`

### Payment
- `amount_money`

**Pattern:** `MoneyCast::class . ':<amount_column>,<currency_column>'`

---

## 🌐 TRANSLATABLE FIELDS (jsonb)

| Model | Fields |
|---|---|
| Ingredient | name |
| IngredientCategory | name |
| MenuCategory | name |
| MenuItem | name, description |
| TableCategory | name |
| LoyaltyProgram | name |
| Country | name (6 locales: uz, ru, en, kz, ky, tg) |
| Currency | name (3 locales) |
| TenantApp | description, keywords |
| TenantBrand | hero_title, hero_subtitle, tagline |

**Pattern:**
```php
public function name(string $locale = 'uz'): string
{
    return $this->name[$locale] ?? $this->name['uz'] ?? '';
}
```

---

## 📚 APPEND-ONLY LEDGER MODELS

(NO `updated_at` — DB consistency invariant)

1. **AiGenerationLog** — created_at only
2. **LoyaltyTransaction** — created_at only
3. **TimeClockEvent** — created_at only
4. **StockMovement** — created_at + recorded_at
5. **AuditLog** — created_at only
6. **ExchangeRate** — created_at + fetched_at
7. **NotificationLog** — created_at + updated_at (lekin retention'da created_at)

---

## 🎯 BelongsToTenant TRAIT QO'LLANISHI

**Trait yo'li:** `app/Domain/Shared/Concerns/BelongsToTenant.php`

**Funksiya:** Eloquent global scope — har query'ga avtomatik `WHERE tenant_id = current_tenant()` qo'shadi.

### TENANT-SCOPED MODELLAR (28 ta):
AiGenerationLog, Customer, LoyaltyAccount, LoyaltyProgram, LoyaltyTransaction, Employee, Shift, ShiftBreak, TimeClockEvent, CourierLocation, Ingredient, IngredientCategory, Recipe, StockMovement, Supplier, KioskDevice, KioskPairingCode, MenuCategory, MenuItem, NotificationLog, Order, OrderItem, Payment, Table, TableCategory, TenantApp, TenantAppBuild, TenantBrand, TenantDomain

### GLOBAL/CROSS-TENANT MODELLAR (6):
- **Country, Currency, ExchangeRate** — global lookup tables
- **AuditLog, SuperAdminInvitation** — super-admin scope
- **NotificationPreference** — user-scoped (no tenant_id)
- **Tenant** — root entity
- **User** — global with optional tenant

---

## 🔧 TRAIT MATRIX

| Model | HasFactory | HasUuids | BelongsToTenant | SoftDeletes |
|---|:---:|:---:|:---:|:---:|
| User | ✅ | (uuid col) | ❌ | ✅ |
| Tenant | ✅ | ✅ | ❌ | ✅ |
| Customer | ✅ | ✅ | ✅ | ✅ |
| Employee | ✅ | ✅ | ✅ | ✅ |
| Order | ✅ | ✅ | ✅ | ✅ |
| OrderItem | ✅ | ✅ | ✅ | ✅ |
| MenuItem | ✅ | ✅ | ✅ | ✅ |
| MenuCategory | ✅ | ✅ | ✅ | ✅ |
| Table | ✅ | ✅ | ✅ | ✅ |
| TableCategory | ✅ | ✅ | ✅ | ✅ |
| Ingredient | ✅ | ✅ | ✅ | ✅ |
| Supplier | ✅ | ✅ | ✅ | ✅ |
| KioskDevice | ✅ | ✅ | ✅ | ✅ |
| TenantApp | ✅ | ✅ | ✅ | ✅ |
| TenantDomain | ✅ | ✅ | ✅ | ✅ |
| Payment | ✅ | ✅ | ✅ | ❌ |
| Shift | ✅ | ✅ | ✅ | ❌ |
| ShiftBreak | ✅ | ✅ | ✅ | ❌ |
| LoyaltyTransaction | — | ✅ | ✅ | ❌ |
| StockMovement | ✅ | ✅ | ✅ | ❌ |
| TimeClockEvent | — | ✅ | ✅ | ❌ |
| CourierLocation | — | ✅ | ✅ | ❌ |
| AuditLog | — | ✅ | ❌ | ❌ |
| Country | — | (code PK) | ❌ | ❌ |
| Currency | — | (code PK) | ❌ | ❌ |

---

> Yangilangan: 2026-05-03 · Manba: 34 ta Eloquent model fayli (Domain + App\Models)
