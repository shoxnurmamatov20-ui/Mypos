# 🗄️ DATABASE SCHEMA — TO'LIQ KATALOG

> Manba: `apps/api/database/migrations/` (65 migration: 64 tenant + 1 landlord)
> DBMS: **PostgreSQL 17**
> Multi-tenancy: **RLS** (Row Level Security) + `tenant_id` columns
> Money: **Minor units** (integer) — UZS uchun decimals=0, USD/EUR uchun decimals=2

---

## 📊 STATISTIKA

| Element | Soni |
|---|---|
| Jami jadvallar | **47+** |
| Soft-delete jadvallar | 14 |
| RLS-protected | 23 (19 core + 4 in-migration) |
| PII-encrypted columnlar | 8 |
| Partitioned (RANGE) | 1 (`courier_locations`) |
| Functional indexes | 1 (`orders` DATE) |
| Partial unique indexes | 5+ |
| Translatable (jsonb) ustunlar | 12+ |
| Append-only ledger jadvallar | 7 |

---

## 🏛️ JADVALLAR DOMENLAR BO'YICHA

### 1. AUTH + USER

#### `users`
**Migration:** `0001_01_01_000000_create_users_table.php`
**PK:** `id` (bigint)

| Ustun | Tip | Default | Notes |
|---|---|---|---|
| id | bigint | — | PK |
| name | varchar(255) | — | |
| email | varchar(255) | — | unique |
| email_verified_at | timestamp | null | |
| password | varchar(255) | — | hashed |
| remember_token | varchar(100) | null | |
| uuid | uuid | — | unique |
| tenant_id | uuid | null | FK → tenants.id ON DELETE SET NULL |
| phone | text | null | encrypted (Phase 5) |
| locale | varchar(8) | 'uz' | |
| avatar_url | varchar(512) | null | |
| last_login_at | timestamp | null | |
| last_login_ip | varchar(45) | null | |
| is_super_admin | boolean | false | |
| super_admin_role | varchar(32) | null | owner\|admin\|support\|finance\|developer |
| last_super_admin_login_at | timestamp | null | |
| mfa_enabled | boolean | false | |
| mfa_secret | varchar(255) | null | encrypted |
| phone_index | varchar(64) | null | HMAC lookup |
| deleted_at | timestamp | null | soft delete |

**Indexes:** unique(email), unique(uuid), unique(phone), idx(tenant_id), idx(is_super_admin), idx(phone_index), idx(super_admin_role)

#### `personal_access_tokens` (Sanctum)
**Migration:** `2026_04_19_230906`
- id (bigint, PK), tokenable_type/id (polymorphic), name, **token** (varchar 64, unique), abilities, last_used_at, expires_at

#### `password_reset_tokens`
- email (PK), token, created_at

#### `sessions`
- id (varchar 255, PK), user_id, ip_address, user_agent, payload, last_activity

---

### 2. PERMISSIONS + AUDIT (Spatie + MyPOS)

#### `permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions`
**Migration:** `2026_04_19_232050_create_permission_tables.php`
**Source:** Spatie\Permission paketi
- Multi-guard (web + sanctum)
- `events_enabled = false`, `teams = false`

#### `activity_log` (Spatie ActivityLog)
- id (bigint, PK), log_name, description, subject (poly), causer (poly), event, attribute_changes (json), properties (json)

#### `audit_logs` (MyPOS custom)
**Migration:** `2026_04_25_440002`
- id (uuid, PK), tenant_id, **actor_user_uuid**, actor_type (user\|super_admin\|system\|api), action, subject_type/id/label, severity (debug\|info\|warning\|error\|critical), ip_address, user_agent, metadata (jsonb), created_at
- **Append-only** (no updated_at)
- **5 ta compound index** (tenant_created, actor_created, action_created, severity_created, subject_combo)
- ⚠️ Excluded from RLS — super-admin needs cross-tenant view

#### `super_admin_invitations`
**Migration:** `2026_04_25_440003`
- id (uuid, PK), email, **token_hash** (sha256), invited_by_user_uuid, accepted_at, accepted_by_user_uuid, expires_at, revoked_at, metadata
- 7-day expiration

#### `media` (Spatie MediaLibrary)
- Polymorphic media attachment, MinIO storage
- model_type/id, uuid, collection_name, file_name, mime_type, size, manipulations/conversions/responsive_images (json)

---

### 3. MULTI-TENANCY

#### `tenants` (asosiy)
**Migration:** `2026_04_20_000001`
**~25 ustun** — billing/lifecycle/capabilities tracking:

| Ustun | Tip | Default | Notes |
|---|---|---|---|
| id | uuid | — | PK |
| slug | varchar(64) | — | unique |
| name | varchar(128) | — | |
| legal_name | varchar(256) | null | |
| plan | varchar(32) | 'free' | |
| status | varchar(32) | 'trialing' | trialing\|active\|suspended\|cancelled |
| default_locale | varchar(8) | 'uz' | |
| default_currency | varchar(8) | 'UZS' | |
| timezone | varchar(64) | 'Asia/Tashkent' | |
| settings | jsonb | null | |
| feature_flags | jsonb | null | super-admin-only |
| trial_ends_at | timestamp | null | |
| subscription_plan | varchar(32) | 'free' | free\|starter\|pro\|business\|enterprise |
| subscription_status | varchar(32) | 'active' | |
| mrr_minor | integer | 0 | |
| **tier** | varchar(32) | 'free' | free\|pro\|plus\|enterprise (capabilities) |
| tier_started_at | timestamp | null | |
| tier_expires_at | timestamp | null | |
| country_code | char(2) | 'UZ' | FK → countries.code |
| currency_code | char(3) | 'UZS' | FK → currencies.code |
| total_orders_count | integer | 0 | denormalized |
| total_revenue_minor | bigint | 0 | denormalized |
| deleted_at | timestamp | null | soft delete |

**Indexes:** plan, status, (subscription_plan, subscription_status), suspended_at, last_active_at, tier, country_code

#### `tenant_domains`
**Migration:** `2026_05_15_000001`
- id (uuid), tenant_id, **domain** (varchar 253, unique), is_primary, is_verified, verification_method (txt\|cname), verification_token, verified_at, ssl_status (pending\|provisioning\|active\|error), ssl_issued_at, ssl_error
- **Partial unique** `(tenant_id) WHERE is_primary=true AND deleted_at IS NULL`

#### `tenant_brands`
**Migration:** `2026_05_15_000002`
- **PK = tenant_id** (1:1 with tenants)
- Theme: modern\|classic\|minimal\|premium
- Brand colors (primary, accent, text, background — hex without alpha)
- Logo/cover/hero/favicon URLs (MinIO)
- i18n: hero_title, hero_subtitle, tagline (jsonb)
- Native app: native_app_icon_url, native_app_splash_url, native_app_screenshots
- custom_css (Plus tier)
- Social: instagram_handle, facebook_url, telegram_handle

#### `tenant_apps` (Phase 3 — Native apps)
**Migration:** `2026_06_01_000001`
- id (uuid), tenant_id, platform (ios\|android\|universal), app_name, bundle_id, description (jsonb i18n), keywords, icon/splash/feature_graphic URLs
- apple_team_id, apple_app_id, apple_sku, google_package_name
- build_account (mypos\|tenant), status (draft\|configuring\|building\|review\|live\|rejected\|paused)
- current_version, current_build_number, **latest_build_id** (denormalized pointer)
- **Partial unique** `(bundle_id) WHERE deleted_at IS NULL`
- **Partial unique** `(tenant_id, platform) WHERE deleted_at IS NULL`

#### `tenant_app_builds`
**Migration:** `2026_06_01_000002` + `2026_06_01_000004` (submitted_at)
- id (uuid), tenant_id, tenant_app_id, platform, status (queued\|in-progress\|finished\|failed\|errored\|canceled), submission_status (pending\|submitted\|in_review\|approved\|rejected)
- eas_build_id, eas_project_id, build_profile (production\|preview\|development)
- artifact_url, log_url, qr_code_url
- Append-only build history

#### `tenant_registration_pins`
**Migration:** `2026_04_20_000001`
- pin (unique), tenant_id, issued_by, used_at, used_by, expires_at

#### `landlord/tenants` (Spatie multi-tenancy landlord)
**Migration:** `landlord/2026_04_19_232050`
- id (bigint), name, **domain** (unique), database (unique)

---

### 4. MENU + KATALOG

#### `menu_categories`
**Migration:** `2026_04_20_100001`
- id (uuid), tenant_id, **name** (jsonb {uz,ru,en}), slug, icon, color, sort_order, is_active, **parent_id** (self-FK)
- Hierarchical (parent_id self-reference)
- Soft deletes
- **Unique** `(tenant_id, slug)`

#### `menu_items`
**Migration:** `2026_04_20_100002`
- id (uuid), tenant_id, category_id (FK ON DELETE RESTRICT)
- **name, description** (jsonb i18n)
- slug, sku
- price_amount (integer minor), price_currency, cost_amount
- image_url, thumbnail_url
- allergens (jsonb array), tags (jsonb), calories, preparation_minutes
- is_active, is_featured, is_new, has_discount, discount_percent
- stock_tracked, current_stock, low_stock_threshold
- sort_order
- Soft deletes
- **Indexes:** tenant_active, tenant_category, tenant_featured, tenant_sku

---

### 5. STOLLAR + ZAL

#### `table_categories`
- id (uuid), tenant_id, **name** (jsonb), slug, sort_order, is_active
- Soft deletes

#### `tables`
**Migration:** `2026_04_20_200002`
- id (uuid), tenant_id, category_id, name (varchar 64), capacity, status (available\|occupied\|reserved\|out_of_service)
- shape (round\|square\|rectangular)
- **position_x/y, width, height** (floor plan coordinates)
- **qr_code** (varchar 128, unique) — QR ordering
- metadata (jsonb)
- Soft deletes

---

### 6. ORDERS + ORDER_ITEMS

#### `orders` ⭐ ENG MURAKKAB JADVAL
**Migration:** `2026_04_20_300001` + 10+ ALTER migrations

**Asosiy ustunlar:**
| Ustun | Tip | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK + RLS |
| **order_no** | varchar(32) | per-tenant unique |
| **tracking_token** | varchar(64) | unique — guest tracking |
| type | varchar(32) | dine_in\|takeaway\|delivery\|kiosk\|qr_menu\|telegram |
| status | varchar(32) | draft\|pending\|preparing\|ready\|served\|completed\|cancelled\|refunded |
| payment_status | varchar(32) | unpaid\|partial\|paid\|refunded |
| payment_method | varchar(32) | cash\|card\|click\|payme\|uzum\|apelsin |

**Munosabatlar:**
| FK ustun | → Jadval | ON DELETE |
|---|---|---|
| table_id | tables.id | SET NULL |
| customer_id | customers.id | SET NULL |
| employee_id | employees.id | SET NULL — order yaratuvchi |
| served_by_id | employees.id | SET NULL — waiter |
| courier_id | employees.id | SET NULL — kuryer |
| kiosk_device_id | kiosk_devices.id | SET NULL |
| kiosk_session_id | uuid | nullable |

**Pul ustunlar (integer minor units):**
- subtotal_amount, tax_amount, discount_amount, tip_amount, service_charge_amount
- total_amount, paid_amount
- delivery_fee_minor, courier_earnings_minor

**Currency:**
- currency (varchar 8) — legacy
- **currency_code** (char 3, FK → currencies.code) — Phase 4

**Lifecycle timestamps:**
- placed_at, prepared_at, served_at, paid_at, completed_at, cancelled_at
- picked_up_at, delivering_at, delivered_at

**🔒 PII encrypted (Phase 0):**
- delivery_address (text encrypted, was jsonb)
- delivery_phone (text encrypted)
- delivery_notes (text encrypted)
- customer_phone_for_receipt (text encrypted)

**Indexes (chuqur tahlil):**
1. unique(tenant_id, order_no)
2. unique(tracking_token)
3. idx(tenant_id, status)
4. idx(tenant_id, created_at)
5. idx(tenant_id, table_id)
6. idx(tenant_id, employee_id)
7. idx(tenant_id, employee_id, created_at)
8. idx(tenant_id, served_by_id)
9. idx(tenant_id, courier_id, status)
10. idx(tenant_id, status, picked_up_at)
11. idx(tenant_id, kiosk_device_id, created_at)
12. idx(tenant_id, kiosk_session_id)
13. **idx(tenant_id, status, created_at DESC)** — Phase 0 dashboard/KDS
14. **idx(tenant_id, DATE(created_at))** — functional, Phase 0 charts
15. idx(tenant_id, currency_code) — Phase 4 multi-currency

#### `order_items`
**Migration:** `2026_04_20_300002`
- id, tenant_id, order_id (CASCADE), menu_item_id (SET NULL)
- **name_snapshot** (varchar 256) — frozen at order time
- price_amount, quantity, subtotal_amount, currency
- **modifiers** (jsonb array) — `[{id, name, price_delta}]`
- status (pending\|preparing\|ready\|served\|cancelled)
- **cook_id** (FK employees) — kim pishirayapti
- started_preparing_at, ready_at, prep_duration_seconds
- Soft deletes

---

### 7. PAYMENTS

#### `payments`
**Migration:** `2026_04_20_430001`
- id (uuid), tenant_id, **order_id** (CASCADE)
- provider (cash\|card\|click\|payme\|uzum\|apelsin)
- provider_transaction_id
- amount (integer), currency, **currency_code** (FK Phase 4)
- status (pending\|authorized\|captured\|failed\|refunded\|cancelled)
- failure_reason
- raw_request, raw_response (jsonb)
- **idempotency_key** (unique) — retry safety
- authorized_at, captured_at, refunded_at, failed_at

---

### 8. CUSTOMERS + LOYALTY

#### `customers` 🔒 PII heavy
**Migration:** `2026_04_20_400001` + 2 phase 0 ALTERs
- id (uuid), tenant_id (CASCADE)
- **phone (text encrypted)** — was varchar(32)
- **phone_index (varchar 64)** — HMAC-SHA256 lookup
- **email (text encrypted)** — was varchar(128)
- first_name, last_name, birthday, locale, gender, avatar_url
- tags (jsonb), **notes (text encrypted)**
- total_orders, total_spent, last_visit_at (denormalized)
- Soft deletes
- **Unique** `(tenant_id, phone_index)`

#### `loyalty_programs`
- id, tenant_id, **name** (jsonb i18n), is_active
- **points_per_currency_unit** (decimal 10,4 — default 0.01 → 1 point per 100 UZS)
- **redemption_rate_uzs** (integer — default 10 → 1 point = 10 UZS)
- tier_rules (jsonb)

#### `loyalty_accounts`
- id, tenant_id, customer_id, program_id
- tier (bronze\|silver\|gold\|platinum)
- points_balance, lifetime_points
- **Unique** `(customer_id, program_id)`

#### `loyalty_transactions` — Append-only ledger
- id, tenant_id, account_id, order_id (SET NULL)
- **delta** (integer — positive earn, negative redeem)
- balance_after
- reason (order_earn\|manual_adjust\|redeem\|expiration)
- metadata (jsonb)
- created_at (useCurrent), **NO updated_at**

---

### 9. EMPLOYEES + SHIFTS + TIME TRACKING

#### `employees`
- id, tenant_id, **user_uuid** (unique FK → users.uuid)
- employee_code (per-tenant unique)
- position, hire_date, base_salary, hourly_rate
- status (active\|terminated\|on_leave\|suspended)
- **pin_code_hash** (bcrypt — Phase 1.5)
- pin_set_at, last_clock_in_at (denormalized)
- emergency_contact, documents (jsonb)
- Soft deletes

#### `shifts`
- id, tenant_id, employee_id (CASCADE)
- scheduled_start, scheduled_end
- actual_start, actual_end
- status (scheduled\|in_progress\|completed\|cancelled\|no_show)

#### `shift_breaks`
**Migration:** `2026_04_25_410002` — RLS policy embedded
- id, tenant_id, shift_id (CASCADE), employee_id (CASCADE)
- started_at, ended_at, duration_minutes
- reason (lunch\|rest\|personal\|medical), notes

#### `time_clock_events` — Append-only
- id, tenant_id, shift_id (SET NULL), employee_id (CASCADE)
- event_type (clock_in\|clock_out\|break_start\|break_end)
- recorded_at (client-side timestamp), source (manual\|pin\|nfc\|biometric\|mobile)
- metadata (jsonb)
- **Only created_at**

#### `staff_pin_attempts` — Brute force protection
**Migration:** `2026_04_25_410005`
- id, **tenant_id (NULLABLE — pre-tenant attempts)**
- phone (varchar 32), ip_address, success (boolean), attempted_at
- **idx(phone, attempted_at)** — rate-limit counting
- RLS allows NULL tenant for cross-tenant rate-limiting

---

### 10. INVENTORY

#### `ingredient_categories`
- id, tenant_id, **name** (jsonb i18n), sort_order

#### `ingredients`
- id, tenant_id, category_id (SET NULL)
- **name** (jsonb i18n), sku (per-tenant unique)
- unit (kg\|g\|L\|ml\|piece\|bunch...)
- cost_per_unit (integer minor)
- **current_stock** (decimal 12,3) — fractional units
- min_stock, reorder_point (decimal 12,3)
- is_active, metadata (jsonb)
- Soft deletes

#### `recipes` — Many-to-many menu↔ingredients
- id, tenant_id
- menu_item_id (CASCADE), ingredient_id (CASCADE)
- **quantity** (decimal 12,3) — ingredient units per 1 menu item
- unit, is_optional
- **Unique** `(menu_item_id, ingredient_id)`

#### `stock_movements` — Append-only ledger
- id, tenant_id, ingredient_id (CASCADE)
- **delta** (decimal 12,3 — positive receive, negative consume)
- balance_after
- reason (order_consume\|purchase\|adjust\|waste\|transfer)
- reference_type/id (polymorphic)
- cost_per_unit, notes
- recorded_at (movement time), created_by (user_uuid)
- created_at (useCurrent), **NO updated_at**

#### `suppliers`
- id, tenant_id, name (per-tenant unique), contact_name, phone, email, address, is_active
- Soft deletes

---

### 11. KIOSK

#### `kiosk_devices`
**Migration:** `2026_04_25_430001` — RLS embedded
- id (uuid), tenant_id (CASCADE)
- name, location_label
- **device_token_hash** (bcrypt unique)
- device_token_last4
- paired_at, last_seen_at, last_ip_address
- device_info (jsonb — OS, app_version, screen_size)
- status (unpaired\|paired\|disabled)
- language, theme (light\|dark)
- idle_timeout_seconds (default 60)
- Soft deletes

#### `kiosk_pairing_codes`
**Migration:** `2026_04_25_430002` — RLS embedded
- id, tenant_id (CASCADE)
- code (varchar 8 — 6-digit displayed)
- device_id (SET NULL), expires_at, consumed_at
- created_by_user_uuid
- **Unique** `(tenant_id, code)`

---

### 12. COURIER

#### `courier_locations` ⭐ PARTITIONED
**Migration:** `2026_04_25_420002` + `2026_05_01_000007` (partition)
- id, **(id, recorded_at) composite PK** (partition key inclusion)
- tenant_id (CASCADE), employee_id (CASCADE), order_id (SET NULL)
- **lat, lng** (decimal 10,7)
- accuracy_meters (decimal 8,2)
- heading (decimal 5,2 — 0-360°)
- speed_mps (decimal 6,2)
- battery_percent
- recorded_at (client GPS timestamp)

**🔥 PARTITIONING:**
- **PARTITION BY RANGE(recorded_at)** — monthly children
- Pre-created 13 monthly partitions + 1 default catch-all
- Retention: 7 days (DROP old month partitions)
- Volume: 8.64M rows/day (1k couriers × 6 inserts/min × 1440 min)

**Indexes per-partition:**
- (tenant_id, employee_id, recorded_at DESC)
- (tenant_id, order_id, recorded_at DESC)
- (recorded_at) — retention sweeps

---

### 13. NOTIFICATIONS

#### `notifications_log` 🔒 PII encrypted
- id, tenant_id (CASCADE)
- channel (email\|sms\|push\|telegram\|in_app)
- **recipient (text encrypted)** — was varchar 256
- template (order_placed\|order_ready\|...)
- subject (varchar 256)
- **body (text encrypted)**
- status (queued\|sent\|failed\|delivered\|read)
- provider_message_id, error_message
- metadata (jsonb)
- sent_at, delivered_at
- **Retention: 90 days** (`notifications_log_retention_idx` on created_at)

#### `notification_preferences`
- id (uuid), user_uuid (CASCADE), channel, template (nullable — null=all templates), enabled
- **Unique** `(user_uuid, channel, template)`
- ❌ No tenant_id — user-scoped (no RLS)

---

### 14. REFERENCE DATA (Phase 4)

#### `countries`
**Migration:** `2026_07_01_000001`
**PK = code (char 2 — ISO 3166-1)**
- name (jsonb {uz,ru,en,kz,ky,tg})
- currency_code (char 3, FK)
- default_locale (BCP-47), phone_prefix (E.164), timezone (IANA)
- is_active, launched_at
- Seed: UZ, KZ, KG, TJ, RU

#### `currencies`
**Migration:** `2026_07_01_000002`
**PK = code (char 3 — ISO 4217)**
- name (jsonb), symbol, **decimals** (smallint — 0 for UZS, 2 for most)
- Seed: UZS, KZT, KGS, TJS, USD, RUB, EUR

#### `exchange_rates`
**Migration:** `2026_07_01_000003`
- id (bigserial)
- from_currency, to_currency (FK currencies.code)
- **rate** (decimal 18,8) — "1 from = N to" (e.g. USD→UZS rate 12805.50)
- source (cbu\|nbp\|fixer\|manual)
- rate_date (effective date), fetched_at, created_at
- **Unique** `(from_currency, to_currency, rate_date)`
- Append-only

---

### 15. AI

#### `ai_generations_log`
**Migration:** `2026_07_01_000006`
- id, tenant_id (NULLABLE — public onboarding allowed), user_id
- feature (AiFeature enum), model
- input_tokens, output_tokens, cost_usd (float), duration_ms
- status (AiGenerationStatus enum)
- request_payload, response_payload (jsonb)
- error_message, ip_address
- Append-only audit
- Allows NULL tenant for cross-tenant abuse tracking

---

### 16. SYSTEM

#### `jobs` (Laravel Queue)
- id, queue, payload, attempts, reserved_at, available_at, created_at

#### `job_batches`
- id (varchar PK), name, total_jobs/pending/failed, options, cancelled_at, finished_at

#### `failed_jobs`
- id, uuid (unique), connection, queue, payload, exception, failed_at

#### `cache`, `cache_locks`
- key (PK), value/owner, expiration

---

## 🔒 PHASE 0 SECURITY MIGRATIONS

### 1️⃣ RLS Enable (`2026_05_01_000001`)

**19 ta jadval RLS himoya ostida:**
menu_categories, menu_items, table_categories, tables, orders, order_items, customers, loyalty_programs, loyalty_accounts, loyalty_transactions, employees, shifts, time_clock_events, ingredient_categories, ingredients, recipes, stock_movements, suppliers, payments, notifications_log

**Policy formula:**
```sql
CREATE POLICY tenant_isolation_<table>
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
  OR current_setting('app.current_tenant_id', true) = '*'  -- super admin
)
WITH CHECK (same);
```

**Middleware integration:**
```php
// SetTenantContext::handle()
DB::statement("SET LOCAL app.current_tenant_id = ?", [$tenantId]);
// Super admin:
DB::statement("SET LOCAL app.current_tenant_id = '*'");
```

**Excluded jadvallar (sabab bilan):**
- `tenants` — multi-tenant routing pre-context
- `users` — login flow pre-context, nullable tenant_id
- `audit_logs` — super-admin cross-tenant view
- `super_admin_invitations` — global
- `notification_preferences` — user-scoped (no tenant_id)
- `tenant_registration_pins` — pre-tenant lifecycle

**RLS-in-create migrations:**
- `courier_locations`, `kiosk_devices`, `kiosk_pairing_codes`, `shift_breaks`

**Special handling:**
- `staff_pin_attempts` — `tenant_id IS NULL` allowed (pre-tenant)
- `ai_generations_log` — `tenant_id IS NULL` allowed (public onboarding) + super-admin '*'

### 2️⃣ PII Encryption (`2026_05_01_000003`, `2026_05_01_000004`)

**8 ustun encrypted (Laravel Crypt::encryptString — AES-CBC):**
| Jadval | Ustun | Tip |
|---|---|---|
| customers | phone | text (was varchar 32) |
| customers | email | text (was varchar 128) |
| customers | notes | text |
| orders | delivery_phone | text (was varchar 32) |
| orders | delivery_address | text (was jsonb) |
| orders | delivery_notes | text |
| orders | customer_phone_for_receipt | text |
| notifications_log | recipient | text (was varchar 256) |
| notifications_log | body | text |

**Lookup strategy:**
- AES-CBC = random ciphertext (no equality match)
- HMAC-SHA256 → `phone_index` deterministic key
- Migration `_000004` — backfill (idempotent: detects encrypted, skips)

### 3️⃣ Tracking Token (`2026_05_01_000005`)
- `orders.tracking_token` (varchar 64, unique)
- Server-side UUID, never exposed as orders.id
- Public guest tracking endpoint

### 4️⃣ PIN Index Drop (`2026_05_01_000006`)
- `employees.pin_code_hash` index deleted
- Sabab: bcrypt har xil hash ishlab chiqaradi, equality search ishlamaydi

### 5️⃣ Partitioning (`2026_05_01_000007`)
- `courier_locations` → RANGE(recorded_at)
- 13 monthly + 1 default partition
- PK changed: `id` → `(id, recorded_at)`

### 6️⃣ Compound Indexes (`2026_05_01_000008`)
**orders 3 ta yangi index:**
1. `(tenant_id, status, created_at DESC)` — KDS/dashboard
2. `(tenant_id, DATE(created_at))` — functional, charts
3. **DROP** `created_at` standalone idx (covered by composites)

### 7️⃣ Audit Cleanup (`2026_05_01_000009`)
- Drop `audit_logs_created_at_idx` (5 ta composite covers it)

### 8️⃣ Notifications Retention (`2026_05_01_000010`)
- Add `notifications_log_retention_idx (created_at)`
- 90-day DELETE sweep (10k batch chunks)

---

## 🌍 PHASE 4 ADDITIONS (Multi-currency)

### Tenant extension
- `country_code` (char 2, FK → countries.code)
- `currency_code` (char 3, FK → currencies.code)

### Orders/Payments extension
- `currency_code` (char 3, FK)
- Composite indexes `(tenant_id, currency_code)`
- Legacy `currency` varchar saqlanadi (deprecation Phase 5)

---

## 📈 STATISTIKA SUMMARY

### Storage primitives
- **UUIDs:** ~28 ta jadvalda PK
- **bigint PKs:** users, personal_access_tokens, exchange_rates (id), permissions/roles
- **char PKs:** countries (2), currencies (3)
- **composite PKs:** courier_locations (id, recorded_at)

### Translatable jsonb fields
| Jadval | Field |
|---|---|
| menu_categories | name |
| menu_items | name, description |
| table_categories | name |
| ingredient_categories | name |
| ingredients | name |
| loyalty_programs | name |
| countries | name (6 locales) |
| currencies | name (3 locales) |
| tenant_apps | description, keywords |
| tenant_brands | hero_title, hero_subtitle, tagline |

### Money fields (integer minor units)
- orders: subtotal, tax, discount, tip, service_charge, total, paid (~7)
- payments: amount
- customers: total_spent
- menu_items: price_amount, cost_amount
- ingredients: cost_per_unit
- loyalty_transactions: delta, balance_after
- tenants: mrr_minor, total_revenue_minor
- orders: delivery_fee_minor, courier_earnings_minor

### Append-only ledgers (no updated_at)
1. `loyalty_transactions`
2. `time_clock_events`
3. `stock_movements`
4. `audit_logs`
5. `exchange_rates`
6. `password_reset_tokens`
7. `notifications_log` (has updated_at lekin retention'da created_at asosiy)

### Soft deletes (14 ta jadval)
users, tenants, menu_categories, menu_items, table_categories, tables, orders, order_items, customers, employees, suppliers, kiosk_devices, tenant_apps, tenant_domains, ingredients, tenant_app_builds (NO — append-only)

---

## 🔗 RELATIONSHIPS DIAGRAM (matnan)

```
tenants (1)
  ├─ (N) users
  ├─ (1) tenant_brands              [PK = tenant_id]
  ├─ (N) tenant_domains
  ├─ (N) tenant_apps
  │   └─ (N) tenant_app_builds
  ├─ (N) menu_categories ◄─┐
  │   └─ (N) menu_items ───┤
  │       └─ (N) recipes ◄─┤
  ├─ (N) ingredient_categories
  │   └─ (N) ingredients ◄─┘
  │       └─ (N) stock_movements
  ├─ (N) table_categories
  │   └─ (N) tables ◄────────┐
  ├─ (N) orders ◄────────────┤
  │   ├─ (N) order_items     │
  │   ├─ (N) payments        │
  │   ├─ → customers         │
  │   ├─ → employees (3 FK)  │
  │   └─ → kiosk_devices     │
  ├─ (N) customers
  │   └─ (1) loyalty_account
  │       ├─ → loyalty_program
  │       └─ (N) loyalty_transactions
  ├─ (N) employees
  │   ├─ (N) shifts
  │   │   └─ (N) shift_breaks
  │   ├─ (N) time_clock_events
  │   └─ (N) courier_locations  [partitioned]
  ├─ (N) suppliers
  ├─ (N) kiosk_devices
  │   └─ (N) kiosk_pairing_codes
  ├─ (N) notifications_log
  └─ (N) ai_generations_log

countries (1, code='UZ')
  └─ (N) currencies (1)
      └─ (N) exchange_rates
          (from_currency, to_currency, rate_date)
```

---

> Yangilangan: 2026-05-03 · Manba: 65 ta migration fayllari
> 47+ jadval · 23 RLS-protected · 8 PII-encrypted · 1 partitioned (courier_locations)
