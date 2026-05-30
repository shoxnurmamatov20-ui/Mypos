# 🎛️ FILAMENT 3 ADMIN PANEL — TO'LIQ STRUKTURASI

> Manba: `apps/api/app/Filament/`
> Versiya: **Filament 3.3**
> Panel: `/admin` (super-admin only — `User::canAccessPanel()`)
> Provider: `app/Providers/Filament/AdminPanelProvider.php`

---

## 📊 STATISTIKA

| Element | Soni |
|---|---|
| Custom Pages | **3** ta (Wizard) |
| Resources (CRUD) | **25** ta |
| Resource subfolderlar (Pages/Schemas/RelationManagers) | 32 ta |
| Dashboard Widgets | **8** ta |

---

## 📄 CUSTOM PAGES (3 ta)

### 1. `AIStudio.php`
**Path:** `app/Filament/Pages/AIStudio.php`
**Maqsad:** AI generatsiya markaziy boshqaruvi

**Tabs:**
- Menu Generator (kebak, plov... taklif AI)
- Auto-Translate (UZ → RU, EN, KZ)
- Description Generator (menu items uchun)
- Demand Forecast (top items, predict week)

**Yordamchi fayllar:**
- `AIStudio/AIStudioTabsSchema.php` — Tabs definition
- `AIStudio/HandlesAIStudioActions.php` — Actions trait

### 2. `AppBuilder.php`
**Path:** `app/Filament/Pages/AppBuilder.php`
**Maqsad:** Native iOS/Android app yaratish wizard (Plus+ tier)

**Steps (Wizard):**
1. App identity (name, bundle_id)
2. Brand assets (icon, splash, screenshots)
3. Store metadata (description i18n, keywords)
4. EAS Build configuration

**Yordamchi:** `AppBuilder/AppBuilderWizardSchema.php`

### 3. `BrandStudio.php`
**Path:** `app/Filament/Pages/BrandStudio.php`
**Maqsad:** Brand identity studio (logo, colors, fonts)

**Yordamchi:** `BrandStudio/BrandFormSchema.php`

---

## 🗂️ RESOURCES (25 ta CRUD)

### Operatsiyalar (Operations group)

#### 1. `OrderResource` ⭐
**Model:** Order
**Icon:** `heroicon-o-shopping-cart`
**Navigation group:** "Operatsiyalar"
**Sort:** 1

**Form sections:**
- Buyurtma (order_no, tenant, type, status, payment_status, payment_method)
- Kontekst (table, customer, employee, served_by, courier)
- Pul ma'lumoti (subtotal, tax, discount, tip, total — Money displays)
- Lifecycle (placed_at, prepared_at, served_at, paid_at, completed_at)
- Delivery (delivery_address — decrypted, delivery_phone)

**RelationManagers:**
- `ItemsRelationManager` — OrderItems table

**Pages:** ListOrders, ViewOrder, EditOrder

#### 2. `PaymentResource`
**Model:** Payment
**Icon:** banknotes/credit-card
**Pages:** ListPayments, ViewPayment

#### 3. `CustomerResource`
**Model:** Customer
**Pages:** ListCustomers, CreateCustomer, EditCustomer, ViewCustomer

---

### Menu (Menu group)

#### 4. `MenuItemResource`
**Model:** MenuItem
**Form:** Translatable name/description (uz/ru/en), price, image, allergens, tags
**RelationManagers:**
- `RecipesRelationManager` — Linked ingredients

#### 5. `MenuCategoryResource`
**Model:** MenuCategory
**Hierarchical** (parent_id self-ref)

---

### Stollar (Tables)

#### 6. `TableResource`
**Model:** Table
**Form:** Floor plan coordinates, QR code, capacity

#### 7. `TableCategoryResource`

---

### Inventar (Inventory)

#### 8. `IngredientResource`
**Model:** Ingredient
**RelationManagers:**
- `RecipesRelationManager` — Used by menu items
- (Stock movements history)

#### 9. `IngredientCategoryResource`

---

### Xodimlar (Staff)

#### 10. `EmployeeResource`
**Model:** Employee
**Schemas:** `EmployeeResource/Schemas/` (form schema split)
**Pages:** ListEmployees, CreateEmployee, EditEmployee, ViewEmployee

#### 11. `ShiftResource`
**Model:** Shift

#### 12. `ShiftBreakResource`
**Model:** ShiftBreak

#### 13. `CourierLocationResource`
**Model:** CourierLocation
**Notes:** Read-only — partitioned table; eng so'nggi GPS ko'rsatadi

#### 14. `UserResource`
**Model:** User
**Filters:** is_super_admin, tenant_id

---

### Kiosklar

#### 15. `KioskDeviceResource`
**Model:** KioskDevice
**Schemas:** `KioskDeviceResource/Schemas/` — pairing flow

#### 16. `KioskPairingCodeResource`
**Model:** KioskPairingCode

---

### Tenants (Super-admin only)

#### 17. `TenantResource`
**Model:** Tenant
**RelationManagers:**
- `DomainsRelationManager`
- `AppsRelationManager`
- `BrandRelationManager`

#### 18. `TenantDomainResource`
**Model:** TenantDomain
**Schemas:** `TenantDomainResource/Schemas/` — DNS verification UI

#### 19. `TenantAppResource`
**Model:** TenantApp
**Schemas:** `TenantAppResource/Schemas/`

#### 20. `TenantAppBuildResource`
**Model:** TenantAppBuild
**Support:** `TenantAppBuildResource/Support/` — Status helpers

---

### Notifications

#### 21. `NotificationLogResource`
**Model:** NotificationLog
**Notes:** PII (recipient, body) decrypted on view (logged in audit_logs)

---

### AI

#### 22. `AiGenerationLogResource`
**Model:** AiGenerationLog
**Filters:** Tenant, feature, status, date range
**Notes:** Cost tracking dashboard

---

### Reference (Phase 4)

#### 23. `CountryResource`
#### 24. `CurrencyResource`
#### 25. `ExchangeRateResource`

---

## 📊 DASHBOARD WIDGETS (8 ta)

### 1. `ActiveDeliveriesWidget`
**Path:** `app/Filament/Widgets/ActiveDeliveriesWidget.php`
**Maqsad:** Hozir delivery'da bo'lgan orderlar

### 2. `ActiveKiosksWidget`
**Maqsad:** Online kiosk devices

### 3. `ActiveShiftsWidget`
**Maqsad:** Hozir ishlayotgan xodimlar

### 4. `AiCostWidget`
**Maqsad:** Anthropic API cost ($) — bugungi/oylik
**Source:** `ai_generations_log.cost_usd` SUM

### 5. `CourierEarningsWidget`
**Maqsad:** Top kuryerlar (haftalik daromad)

### 6. `CurrentFxRatesWidget`
**Maqsad:** UZS-USD-EUR-RUB hozirgi kurs (`exchange_rates`)

### 7. `KioskRevenueWidget`
**Maqsad:** Kiosklar orqali yig'ilgan daromad

### 8. `StaffPerformanceWidget`
**Maqsad:** Top employees (orders, revenue)

---

## 🛡️ XAVFSIZLIK

### Panel access
```php
// User.php
public function canAccessPanel(Panel $panel): bool
{
    return $this->is_super_admin === true;
}
```

**Faqat super_admin:** Tenant userlari Filament panel'ga kira olmaydi — ular o'z dashboard'larini ishlatadi (web-dashboard Next.js).

### Tenant scope
Filament kontekstida super-admin barcha tenantlarni ko'radi:
```php
// Middleware: SetTenantContext (avtomatik)
// Super admin → SET LOCAL app.current_tenant_id = '*'
```

### PII decryption logging
PII (delivery_phone, customer notes) ko'rilganda → `AuditLog` yoziladi:
```php
// AuditLogger::log('admin.viewed_pii', subject_type: Order, ...)
```

---

## 🎨 UI KONVENSIYALAR

### Navigation groups (UZ tilida)
- Operatsiyalar (Operations) — Orders, Payments
- Menyu (Menu) — Categories, Items
- Inventar (Inventory) — Ingredients, Recipes
- Xodimlar (Staff) — Employees, Shifts
- Stollar (Tables) — Tables, Categories
- Kiosklar (Kiosks)
- Tenantlar (Tenants) — Super-admin only
- Hisobotlar (Reports) — Audit, Activity
- Sozlamalar (Settings) — Reference data

### Translatable form fields
```php
Forms\Components\Group::make([
    TextInput::make('name.uz')->label('Nomi (UZ)'),
    TextInput::make('name.ru')->label('Nomi (RU)'),
    TextInput::make('name.en')->label('Name (EN)'),
])
```

### Table columns (typical)
```php
TextColumn::make('order_no')->searchable(),
BadgeColumn::make('status')->color(fn ($state) => match($state) { ... }),
TextColumn::make('total_amount')->money('UZS'),
TextColumn::make('placed_at')->dateTime()->sortable(),
```

---

## 🔌 PROVIDERLAR

### `AdminPanelProvider.php`
**Path:** `app/Providers/Filament/AdminPanelProvider.php`

**Configuration:**
- Path: `/admin`
- ID: `admin`
- Login: `Filament\Pages\Auth\Login`
- Resources auto-discovered: `app/Filament/Resources/`
- Pages: Dashboard + 3 custom pages
- Widgets: 8 ta dashboard widgets
- Plugins: (Spatie media library, etc.)
- Middleware: `auth`, `EnsureSuperAdmin`

---

## 📦 VITE BUILD (Filament Frontend)

**File:** `apps/api/package.json`
- Vite 7.0.7 + Tailwind 4.0.0
- Build: `vite build` (Filament CSS/JS assets)
- Watch: `vite` (dev mode)

---

> Yangilangan: 2026-05-03 · Manba: 25 Resources + 3 Pages + 8 Widgets
