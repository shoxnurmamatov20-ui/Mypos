# 🛡️ ROLES + PERMISSIONS MATRIX

> Manba: `app/Domain/Auth/Enums/Role.php` + `Spatie\Permission` + 18 ta Policy fayllari
> Auth driver: **Sanctum** (API) + **Filament** (panel)
> Multi-tenancy: `tenant_id` + `BelongsToTenant` global scope

---

## 🎭 ROLLAR IERARXIYASI

### 1. Asosiy Auth Roles (`App\Domain\Auth\Enums\Role`)

| Enum value | Label (UZ) | Maqsad | Tenant scope |
|---|---|---|---|
| `super_admin` | Super Admin | MyPOS team — to'liq nazorat | ❌ Cross-tenant |
| `owner` | Egasi | Tenant egasi (multi-location) | ✅ Tenant |
| `manager` | Menejer | Single-location manager | ✅ Tenant |
| `cashier` | Kassir | To'lov qabul qiluvchi | ✅ Tenant |
| `waiter` | Ofitsiant | Stolda xizmat ko'rsatuvchi | ✅ Tenant |
| `chef` | Oshpaz | Kitchen line | ✅ Tenant |
| `courier` | Kuryer | Yetkazib beruvchi | ✅ Tenant |
| `customer` | Mijoz | Restoran mijozi | ✅ Tenant |

> **Implementation:** Spatie\Permission paket orqali. RolesSeeder har enum case uchun `web` va `sanctum` guard'larida Role yaratadi.

### 2. Super Admin Sub-Roles (`App\Domain\SuperAdmin\Enums\SuperAdminRole`)

| Enum value | Label | Maqsad |
|---|---|---|
| `owner` | Owner | MyPOS kompaniya egasi |
| `admin` | Admin | Operatsion administrator |
| `support` | Support | Mijozlarga yordam |
| `finance` | Finance | Billing va to'lovlar |
| `developer` | Developer | Texnik yordam |

> **Field:** `users.is_super_admin = true` AND `users.super_admin_role = '<value>'`
> **Last login:** `users.last_super_admin_login_at`

### 3. Employee Roles (`App\Domain\Employee\Enums\EmployeeRole`)

> ⚠️ Bu enum faqat staff API surface uchun — auth roles `Auth\Enums\Role` da yashaydi.

| Enum value | Label | isManagerial | isKitchen | isFloor | isCourier |
|---|---|:---:|:---:|:---:|:---:|
| `waiter` | Ofitsiant | ❌ | ❌ | ✅ | ❌ |
| `cook` | Oshpaz | ❌ | ✅ | ❌ | ❌ |
| `cashier` | Kassir | ❌ | ❌ | ✅ | ❌ |
| `manager` | Menejer | ✅ | ❌ | ❌ | ❌ |
| `admin` | Administrator | ✅ | ❌ | ❌ | ❌ |
| `courier` | Kuryer | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 SUPER ADMIN BOOLEAN FIELD

```php
// users.is_super_admin: boolean
// Bu rol Spatie Role'dan ALOHIDA — DB ustun darajasida bool

if ($user->is_super_admin === true) {
    // Cross-tenant access
    // Filament panel access
    // Full audit log access
    // Bypass tenant scopes
}
```

**Sabab:** Super admin barcha tenantlardan tashqari — uni Spatie Role bilan birgalikda ishlatish multi-tenant ozgun bo'lardi.

---

## 📋 TARIF (TIER) GATING

> Bu rollardan ALOHIDA — har tenant'ning tarifi (Free/Pro/Plus/Enterprise) feature'larni ochib qo'yadi.

| Tarif | Native iOS | Native Android | Custom Domain | AI Studio | Forecast Insights |
|---|:---:|:---:|:---:|:---:|:---:|
| **Free** ($0/oy) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pro** ($90/oy) | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Plus** ($300/oy) | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Enterprise** ($1500+/oy) | ✅ (own dev acct) | ✅ (own dev acct) | ✅ | ✅ | ✅ |

**Service:** `App\Domain\Tenant\Services\TierFeatures.php`
**Method:** `TierFeatures::for($tenant->tier)->canUseNativeApp()`

---

## 🛡️ POLICY FAYLLARI (18 ta)

| Domain | Policy | Methods |
|---|---|---|
| AI | `AiGenerationLogPolicy` | viewAny, view, delete |
| Customer | `CustomerPolicy` | viewAny, view, create, update, delete |
| Employee | `EmployeePolicy` | viewAny, view, create, update, delete |
| Employee | `ShiftPolicy` | viewAny, view, create, delete |
| Employee | `ShiftBreakPolicy` | viewAny, view |
| Employee | `CourierLocationPolicy` | viewAny, view, create |
| Inventory | `IngredientPolicy` | viewAny, view, create, update, delete |
| Inventory | `RecipePolicy` | viewAny, view, create, delete |
| Inventory | `StockMovementPolicy` | viewAny, view, create |
| Kiosk | `KioskDevicePolicy` | viewAny, view, update, delete |
| Kiosk | `KioskPairingCodePolicy` | viewAny, create |
| Menu | `MenuCategoryPolicy` | viewAny, view, create, update, delete |
| Menu | `MenuItemPolicy` | viewAny, view, create, update, delete |
| Order | `OrderPolicy` | viewAny, view, create, update, delete, restore, forceDelete, confirmPayment |
| Payment | `PaymentPolicy` | viewAny, view, create, capture, refund |
| Tenant | `TenantPolicy` | (super admin) |
| Tenant | `TenantAppPolicy` | viewAny, view, create, update, delete |
| Tenant | `TenantAppBuildPolicy` | viewAny, view, create, cancel, submit |
| Tenant | `TenantBrandPolicy` | view, update, uploadLogo, ... |
| Tenant | `TenantDomainPolicy` | viewAny, view, create, verify, setPrimary, delete |

---

## 🎯 ORDERPOLICY — DETALLI MISOL

```php
class OrderPolicy
{
    // Helpers:
    isAdminOrManager($user)       // Owner | Manager | super_admin | Employee.isManagerial()
    shareTenant($user, $order)    // tenant_id mosligi
    employeeFor($user)            // Active Employee row
    hasAnyEmployeeRole($user, [roles])
}
```

### Method | Owner | Manager | Cashier | Waiter | Chef | Courier | Super Admin

| Method | Owner | Manager | Cashier | Waiter | Chef | Courier | SuperAdmin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `viewAny` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `view` | ✅ | ✅ | ✅ | ✅ | ✅ | own only | ✅ |
| `create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `update` | ✅ | ✅ | own only | own only | ❌ | ❌ | ✅ |
| `delete` (soft) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `restore` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `forceDelete` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `confirmPayment` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### Maxsus qoidalar
- **Chef** faqat kitchen pipeline'dagi orderlarni ko'radi
- **Courier** faqat o'ziga biriktirilgan orderlarni (`courier_id === $employee->id`)
- **Waiter/Cashier** o'zlari yaratgan orderlarni (`served_by_id === $employee->id` OR `employee_id === $user->id`) update qiladi
- **shareTenant()** har doim — cross-tenant access yo'q (super admin'dan tashqari)

---

## 🔌 MIDDLEWARE'LAR ROLLAR ASOSIDA

| Middleware | Talab | Source |
|---|---|---|
| `auth:sanctum` | Bearer token | Laravel Sanctum |
| `super-admin` | `is_super_admin === true` | `EnsureSuperAdmin.php` |
| `tenant.admin` | `Owner` OR `Manager` + non-null tenant_id | `EnsureTenantAdmin.php` |
| `staff.scope` | Active employee + `Cashier|Waiter|Chef|Courier` | `EnsureActiveStaff.php` |
| `kiosk.device` | Valid KioskDevice token (no User) | `EnsureKioskDevice.php` |

---

## 🔐 REVERB CHANNEL ROLLAR

(Detalli: `04-REVERB-EVENTS.md`)

| Channel | Allowed roles |
|---|---|
| `tenant.{id}.kitchen` | Chef · Manager · Owner |
| `tenant.{id}.dashboard` | Manager · Owner |
| `tenant.{id}.staff` | Owner · Manager · Cashier · Waiter · Chef · Courier |
| `order.{id}` | Tenant user (any role) OR guest with tracking_token |

---

## 📦 SPATIE PERMISSION KONFIG (`config/permission.php`)

| Sozlama | Qiymat | Izoh |
|---|---|---|
| `roles` table | `roles` | Default |
| `permissions` table | `permissions` | Default |
| `model_has_roles` | `model_has_roles` | Default pivot |
| `model_morph_key` | `model_id` | UUID emas, integer ID |
| `register_permission_check_method` | `true` | Gate auto-registered |
| `events_enabled` | `false` | RoleAttachedEvent disabled |
| `teams` | `false` | Tenant ID sifatida ishlatilmaydi |
| `enable_wildcard_permission` | `false` | Aniq permissions |
| `cache.expiration_time` | 24 hours | Permissions caching |
| `cache.key` | `spatie.permission.cache` | Default |

---

## 🛡️ XAVFSIZLIK PRINSIPLARI

### 1. Defense in depth
Har auth check 3 darajada amalga oshiriladi:

```
Layer 1: Middleware (route-level)
  ↓
Layer 2: FormRequest::authorize() (request-level)
  ↓
Layer 3: Policy method (model-level)
  ↓
Layer 4: PostgreSQL RLS (database-level)
```

### 2. Tenant isolation
- `BelongsToTenant` trait — Eloquent global scope
- `SetTenantContext` middleware — RLS session var `app.tenant_id`
- `EnsureTenantAdmin` — middleware-level
- `Policy::shareTenant()` — explicit check

### 3. Mass-assignment guarding
```php
// Tenant model:
protected $fillable = [/* boshqalar */];
// 'tier', 'tier_started_at', 'tier_expires_at' — fillable'da YO'Q
// Faqat ChangeTenantTierAction::forceFill() orqali

// 'feature_flags' — fillable'da YO'Q
// Faqat super-admin Actions orqali
```

### 4. PII encryption (CLAUDE.md §7)
| Field | Model | Cast |
|---|---|---|
| `delivery_address` | Order | `encrypted:array` |
| `delivery_phone` | Order | `encrypted` |
| `delivery_notes` | Order | `encrypted` |
| `customer_phone_for_receipt` | Order | `encrypted` |
| (boshqa PII fields) | Customer | `encrypted` |

### 5. PIN attempts protection
**Table:** `staff_pin_attempts` (migration `2026_04_25_410005`)
- Per-phone IP rate-limit
- Brute-force prevention
- Audit trail

---

## 🎯 USE-CASE: KIM NIMA QILA OLADI?

### "Order yaratish"
```
✅ Owner, Manager, Cashier, Waiter
❌ Chef (faqat kitchen pipeline)
❌ Courier (faqat assigned orders)
❌ Customer (public orders alohida — guest checkout)
```

### "Tarifni o'zgartirish (tier)"
```
✅ Super Admin (faqat ChangeTenantTierAction orqali)
❌ Owner (FORBIDDEN — mass-assignment guard)
❌ Manager
```

### "Native app build trigger"
```
✅ Owner (Plus+ tier kerak)
✅ Super Admin
❌ Manager (faqat read access)
❌ Boshqalar
```

### "Customer PII ko'rish"
```
✅ Owner, Manager (decrypted via Crypt::)
✅ Super Admin (audit log entry yaratiladi)
✅ Cashier, Waiter (faqat o'z orderlari uchun)
❌ Chef, Courier (faqat ish uchun kerakli ma'lumot — ism, telefon snippet)
```

### "Webhook (Click/Payme) qabul qilish"
```
✅ No auth — IP allowlist + signature check
❌ Boshqa hech kim
```

---

## 📊 OBSERVERS — XAVFSIZLIK MONITORING

| Observer | Maqsad |
|---|---|
| `UserSecurityObserver` | User login attempts, MFA, last login IP, PIN brute-force |
| `TenantBrandCacheObserver` | Brand cache invalidation |
| `TenantRegionObserver` | Country/currency consistency check |
| `MenuCacheObserver` | Public menu cache invalidation |

---

## 🧪 SECURITY TESTS

| Test fayli | Tekshiradi |
|---|---|
| `tests/Feature/Security/BelongsToTenantScopeTest.php` | Tenant scope barcha modellarda ishlaydi |
| `tests/Feature/Security/PaymentWebhookBypassTest.php` | Webhook IP allowlist va stub-mode reject |
| `tests/Feature/Security/PiiEncryptionTest.php` | PII fieldlar Crypt:: orqali yopiq |
| `tests/Feature/Security/PolicyEnforcementTest.php` | 18 ta Policy ishlaydi |
| `tests/Feature/Security/SecurityAuditRegressionTest.php` | OWASP regression |
| `tests/Feature/Security/TenantIsolationRlsTest.php` | RLS DB darajasida ishlaydi |
| `tests/Feature/Security/TokenAbilityTest.php` | Sanctum token abilities |

---

> Yangilangan: 2026-05-03 · Manba: 3 ta enum + 18 ta Policy + Spatie config.
