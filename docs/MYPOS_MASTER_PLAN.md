# MyPOS Master Plan — Restoran SaaS Platform

> **Versiya:** 1.0
> **Sana:** 2026-04-26
> **Status:** Tasdiqlash kutilmoqda
> **Maqsad:** Markaziy Osiyo restoran bozorida #1 SaaS platforma

---

## 📜 0. Boshqaruvchi xulosa (Executive Summary)

**MyPOS** — restoranlar uchun **WordPress.com / Shopify uslubidagi** SaaS platforma. Har restoran:
- O'z **custom domeniga** ega bo'ladi (`jomeburger.uz`, `lavashhouse.uz`)
- O'z **native mobil ilovasiga** ega bo'ladi (App Store + Play Store da o'z brendi bilan)
- MyPOS texnologiyasini ishlatadi, lekin foydalanuvchilar buni ko'rmaydi

**Asosiy farqlovchi xususiyat:** Markaziy Osiyoda hozirgacha hech kim restoranlar uchun white-label native app bermaydi. Bu **#1 raqobat ustunligi**.

**Real maqsad (3 yilda):**
- 5,000-10,000 ta to'lovchi restoran
- 500K-1M oyiga faol iste'molchi (MAU)
- $10-15M Annual Recurring Revenue (ARR)
- $100-200M kompaniya bahosi (valuation)

---

## 🎯 1. Vizion va realistik maqsadlar

### 1.1 Halol baho: 999M user — bu real emasmi?

| Platforma | Yillar | MAU yetishtirish | Bahosi |
|---|---|---|---|
| Toast (USA, restoran SaaS) | 12 yil | — | $30B (100K+ restoran) |
| Yandex Eda | 12 yil | 25M MAU | ~$5B |
| Wolt | 8 yil | 17M MAU | $7B |
| Uber Eats | 10 yil | 88M MAU | (Uber'ning bir qismi) |

> **999M** — bu Facebook'ning 5 yillik o'sish raqami. Realistik emas.
> **Realistik:** 5-10K restoran, 500K-1M MAU — bu ham ulkan biznes.

### 1.2 3 yillik maqsadlar bosqichlari

```
Year 1 (Oy 1-12):
  ▸ 500 ta restoran (Toshkent, Samarqand, Buxoro)
  ▸ 50,000-100,000 MAU
  ▸ $500K-$1M ARR
  ▸ Pre-seed funding ($300-500K)

Year 2 (Oy 13-24):
  ▸ 2,000-3,000 ta restoran (butun O'zbekiston)
  ▸ 300,000-500,000 MAU
  ▸ $3-5M ARR
  ▸ Seed funding ($2-5M)

Year 3 (Oy 25-36):
  ▸ 5,000-10,000 ta restoran (+ Qozogiston, Qirgiziston)
  ▸ 500,000-1M MAU
  ▸ $10-15M ARR
  ▸ Series A funding ($10-20M)
```

---

## 🏗️ 2. Texnik arxitektura — Hybrid model

### 2.1 4 ta tarif (Subscription tier)

#### TIER 1: FREE — Marketplace listing
```
┌──────────────────────────────────────────────┐
│ • mypos.uz/restaurants/jome-burger           │
│ • Faqat MyPOS marketplace'da listing         │
│ • Buyurtmalar uchun 12% komissiya            │
│ • Yangi restoranlar uchun start nuqtasi      │
└──────────────────────────────────────────────┘
```

#### TIER 2: PRO — Custom Domain + Web Brand — $90/oy
```
┌──────────────────────────────────────────────┐
│ • jomeburger.uz custom domain (Caddy + SSL)  │
│ • Brand: logo, ranglar, font                 │
│ • PWA ("Add to Home Screen")                 │
│ • Marketplace'da listing davom etadi         │
│ • Buyurtmalar uchun 5% komissiya             │
└──────────────────────────────────────────────┘
```

#### TIER 3: PLUS — Native Mobile App — $300/oy
```
┌──────────────────────────────────────────────┐
│ • Hammasi yuqoridagi                         │
│ • iOS app App Store'da ("Jome Burger")       │
│ • Android app Play Store'da                  │
│ • Push notifications (restoran nomidan)      │
│ • EAS Build avtomatik pipeline               │
│ • Apple "Develop apps for clients" orqali    │
│ • Buyurtmalar uchun 2% komissiya             │
└──────────────────────────────────────────────┘
```

#### TIER 4: ENTERPRISE — Independent — $1500+/oy
```
┌──────────────────────────────────────────────┐
│ • O'z Apple Developer + Google Play account  │
│ • Custom theme (MyPOS dizayner ishlaydi)     │
│ • Dedicated server                           │
│ • SLA 99.9% uptime                           │
│ • Custom integratsiyalar (1C, ERP)           │
│ • White-label POS terminal'i ham             │
│ • 1% komissiya                               │
└──────────────────────────────────────────────┘
```

### 2.2 Texnologiya stack

```
FRONTEND
├─ Web: Next.js 15 + React 19 + Tailwind CSS 4
├─ Mobile: Expo SDK 54 + React Native 0.81
├─ State: Zustand + TanStack Query
└─ i18n: next-intl (UZ/RU/EN/KZ keyinchalik)

BACKEND
├─ API: Laravel 12 + PHP 8.5
├─ Auth: Sanctum (token + cookie)
├─ Queue: Redis 7.4 + Horizon
├─ Real-time: Laravel Reverb (websockets)
├─ Search: Meilisearch
├─ Storage: MinIO (S3-compatible)
└─ Cache: Redis

DATABASE
├─ PostgreSQL 17
├─ Multi-tenant: tenant_id + Eloquent global scope
├─ Defense-in-depth: PostgreSQL Row-Level Security (RLS)
└─ Backup: pgBackRest

DEVOPS
├─ Reverse proxy: Caddy 2 (auto HTTPS via Let's Encrypt)
├─ Containers: Docker Compose (dev), Coolify (prod)
├─ Hosting: UZCLOUD (UZ) + Beeline DC (DR)
├─ Monitoring: Sentry + Plausible Analytics
└─ CI/CD: GitHub Actions

MOBILE BUILD
├─ EAS Build (Expo Application Services)
├─ EAS Submit (App Store + Play Store automation)
├─ Per-tenant config injection
└─ Apple "Develop apps for clients" program

AI
├─ Anthropic Claude API (Opus 4.7)
├─ Menu generator (text → 30 ta dish)
├─ Auto-translate (UZ ↔ RU ↔ EN)
└─ Demand forecasting
```

### 2.3 Multi-domain routing

```
┌──────────────────────────────────────────────────────────┐
│                    DNS (Cloudflare yoki UZCLOUD)         │
│  ┌────────────────┬─────────────────┬─────────────────┐  │
│  │ *.mypos.uz     │ jomeburger.uz   │ lavashhouse.uz  │  │
│  │ wildcard       │ A→185.x.x.x     │ A→185.x.x.x     │  │
│  └────────┬───────┴─────────┬───────┴─────────┬───────┘  │
└───────────┼─────────────────┼─────────────────┼──────────┘
            ▼                 ▼                 ▼
    ┌──────────────────────────────────────────────────┐
    │ Caddy 2 (Reverse Proxy + Auto HTTPS)             │
    │ ──────────────────────────────────────────────── │
    │ • Reads Host header                              │
    │ • Issues SSL via Let's Encrypt automatically     │
    │ • Routes to Next.js based on hostname            │
    └────────────────────┬─────────────────────────────┘
                         ▼
    ┌──────────────────────────────────────────────────┐
    │ Next.js + ResolveTenantMiddleware                │
    │ ──────────────────────────────────────────────── │
    │ SELECT * FROM tenant_domains                     │
    │  WHERE domain = ?                                │
    │  AND verified = true                             │
    │ → tenant_id                                      │
    └────────────────────┬─────────────────────────────┘
                         ▼
    ┌──────────────────────────────────────────────────┐
    │ Render tenant-branded page                       │
    │ ──────────────────────────────────────────────── │
    │ • Logo, colors, fonts (CSS variables)            │
    │ • Menu, products (tenant-scoped)                 │
    │ • Click/Payme integration (tenant credentials)   │
    └──────────────────────────────────────────────────┘
```

### 2.4 Native App Build Pipeline

```
RESTORAN PANEL'DA "Generate App" tugmasi
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Filament Resource: Mobile App Settings          │
│ ─────────────────────────────────────────────── │
│ • App nomi: "Jome Burger"                       │
│ • Bundle ID: com.jomeburger.app (auto-validate) │
│ • Icon (1024x1024)                              │
│ • Splash screen                                 │
│ • App Store description                         │
│ • Tarif tanlash: Plus $300 yoki Enterprise      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Backend: GenerateMobileAppJob (queued)          │
│ ─────────────────────────────────────────────── │
│ 1. mobile-consumer-template ni fork qilamiz     │
│ 2. app.json ga tenant config inject qilinadi    │
│ 3. EXPO_PUBLIC_TENANT_ID set qilinadi           │
│ 4. EAS Build trigger (eas-cli)                  │
│ 5. Build status DB'da kuzatiladi                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ EAS Build Service (Expo cloud)                  │
│ ─────────────────────────────────────────────── │
│ • iOS: IPA (Adhoc + Production)                 │
│ • Android: AAB (Google Play)                    │
│ • Build time: ~25 min                           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ EAS Submit                                      │
│ ─────────────────────────────────────────────── │
│ • App Store Connect upload                      │
│ • Google Play Console upload                    │
│ • Apple Review queue (1-3 kun)                  │
│ • Google Review queue (1-3 kun)                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
✅ App Store + Play Store'da "Jome Burger" LIVE
```

---

## 🚨 3. Audit topgan kritik muammolar

### 3.1 Xavfsizlik — 6 ta KRITIK

| # | Muammo | Joy | Ta'sir |
|---|---|---|---|
| **C1** | PostgreSQL RLS faqat 4 jadvalda (30+ kerak) | `database/migrations/*` | Bitta xato → barcha restoranlar ma'lumotlari leak |
| **C2** | `BelongsToTenant` scope auth bo'lmaganda no-op | `Domain/Shared/Concerns/BelongsToTenant.php:23-28` | Cross-tenant data ochiladi webhook/console kontekstida |
| **C3** | Payment webhook stub bypass | `Domain/Payment/Providers/ClickProvider.php:71-81` | Har kim "stub_ok" yuborib buyurtmani PAID qilishi mumkin |
| **C4** | Order/Payment/Customer/Menu/Inventory uchun Policy yo'q | 6 ta domen | Ofitsiant million so'm refund qila oladi |
| **C5** | Token ability `['*']` super-admin'ga ekvivalent | `EnsureSuperAdmin.php:38-45` | Tenant token super-admin endpoint'ga kirib ketishi mumkin |
| **C6** | Demo seeder hardcoded password productionga tushishi mumkin | `database/seeders/Demo*Seeder.php` | Internet'da `owner@demo.mypos.uz / demo_owner_2026` ochiq |

### 3.2 Performance — 5 ta KRITIK

| # | Muammo | Ta'sir |
|---|---|---|
| **P1** | `PublicMenuController` cache yo'q | 1k QR scan = 1k DB query → DoS |
| **P2** | Reverb sozlangan, lekin hech narsa broadcast qilmaydi | 10K restoran = 8.3K req/sec polling load |
| **P3** | SuperAdmin TenantController N+1 owner lookup | 500 sahifa = sekundlab kutish |
| **P4** | `courier_locations` partition/retention yo'q | Oylar ichida bir necha GB |
| **P5** | Order summary tenant_id JOIN'ga push'lanmagan | 50M rows seq scan |

### 3.3 Funksional muammo

| # | Muammo | Ta'sir |
|---|---|---|
| **F1** | `web-consumer` real API'ga ulanmagan, MOCK_RESTAURANTS ishlatadi | Sayt mavjud, lekin haqiqiy ma'lumot yo'q |

---

## 📅 4. Roadmap — 18 oylik bosqichma-bosqich plan

### 🔴 Phase 0: Xavfsizlik fondament (Hafta 1-2)

**Maqsad:** Audit topgan 6 ta kritik xatoni tuzatish — yangi narsa qurish uchun mustahkam poydevor.

#### Hafta 1: Backend xavfsizlik
```
Day 1-2: PostgreSQL RLS migration
  ✅ db-migration-author agent: hamma 30+ tenant-scoped jadvalga RLS
  ✅ Middleware: SET LOCAL app.current_tenant_id = ? har request boshida
  ✅ Test: super_admin emas user cross-tenant query qila olmaydi

Day 3: BelongsToTenant scope hardening
  ✅ Auth bo'lmaganda whereRaw('1=0') qaytarish (silent allow emas)
  ✅ Whitelist: webhook/kiosk/public routes uchun explicit opt-out
  ✅ Test: unauthenticated context'da Customer::find() exception

Day 4: Payment webhook stub-bypass yopish
  ✅ ClickProvider + PaymeProvider'da stub mode'ni production'da rad qilish
  ✅ APP_ENV check qo'shish
  ✅ Test: production env + empty key → 500 error, log alert

Day 5: Demo seeder guard
  ✅ DemoTenantSeeder, DemoEmployeesSeeder, DemoCustomersSeeder ga env check
  ✅ if (! app()->environment(['local','testing'])) abort
  ✅ Random password generator + console output
```

#### Hafta 2: API xavfsizlik
```
Day 1-2: Policy classes — laravel-backend-dev agent
  ✅ OrderPolicy, PaymentPolicy, CustomerPolicy
  ✅ MenuItemPolicy, MenuCategoryPolicy
  ✅ IngredientPolicy, RecipePolicy, StockMovementPolicy
  ✅ TenantPolicy, UserPolicy
  ✅ Har controller method'ga $this->authorize() qo'shish

Day 3: Token ability cleanup
  ✅ EnsureSuperAdmin'da tokenCan('*') olib tashlash
  ✅ LoginAction tokenni dedicated abilities bilan beradi
  ✅ Token rotation — is_super_admin flag o'zgarganda

Day 4: PII encryption
  ✅ Customer.phone, .email → encrypted cast
  ✅ Order.delivery_phone, .delivery_address → encrypted
  ✅ NotificationLog.recipient, .body → encrypted
  ✅ Migration: existing data'ni encrypt qilish

Day 5: Re-audit
  ✅ security-auditor agent qayta tekshiruv
  ✅ Hamma 6 KRITIK ✅ qilinishi kerak
  ✅ Pest test'lar 80%+ coverage
```

**Phase 0 yakunida:**
- ✅ 6 ta kritik xavfsizlik xatosi tuzatildi
- ✅ DB darajasida defense-in-depth (RLS)
- ✅ Hamma domain'lar uchun Policy
- ✅ PII encryption
- ✅ Production-safe seeders

---

### 🟡 Phase 1: Real backend integratsiya (Oy 1)

**Maqsad:** web-consumer va mobile-consumer real API bilan ishlasin.

```
Hafta 3: web-consumer ulash
  ✅ MOCK_RESTAURANTS olib tashlash
  ✅ /api/v1/public/restaurants endpoint (cursor pagination)
  ✅ /api/v1/public/restaurants/{slug} endpoint
  ✅ /api/v1/public/menu/{slug} endpoint (cache 60s)
  ✅ Cart → /api/v1/public/orders (guest checkout)
  ✅ Click/Payme intent flow

Hafta 4: mobile-consumer ulash
  ✅ Restoran ro'yxati (location-based)
  ✅ Menyu, kart, checkout
  ✅ Order tracking (Reverb subscription)
  ✅ Loyalty ballarni ko'rish

Hafta 5: Reverb broadcasts (real-time)
  ✅ OrderPlaced → ShouldBroadcast (channel: tenant.{id}.kitchen)
  ✅ OrderItemStatusChanged → broadcast
  ✅ CourierLocationUpdated → broadcast
  ✅ Polling widget'larni Echo subscription'ga almashtirish

Hafta 6: Performance fix
  ✅ PublicMenuController cache (60s + ETag)
  ✅ courier_locations partitioning + retention
  ✅ Filament Resources eager loading (10 ta resource)
  ✅ SuperAdmin KPI cache
  ✅ performance-auditor re-audit
```

**Phase 1 yakunida:**
- ✅ Web Consumer real ishlaydi
- ✅ Mobile Consumer real ishlaydi
- ✅ Real-time updates (websockets)
- ✅ Performance baseline ✓

---

### 🟢 Phase 2: Custom Domain + Branding (Oy 2-3)

**Maqsad:** Restoranlar `jomeburger.uz` ko'rinishida o'z saytlariga ega bo'lishlari mumkin.

#### Oy 2: Infrastructure
```
Hafta 7-8: Caddy reverse proxy
  ✅ infra/docker-compose.yml ga Caddy qo'shish
  ✅ Caddyfile dynamic config
  ✅ Let's Encrypt automation
  ✅ Wildcard SSL (*.mypos.uz)

Hafta 9: Custom domain backend
  ✅ tenant_domains migration (db-migration-author)
  ✅ ResolveTenantMiddleware (Next.js + Laravel)
  ✅ Domain ownership verification (TXT record)
  ✅ SSL provisioning queue job

Hafta 10: Filament UI
  ✅ "Add Custom Domain" wizard
  ✅ DNS check API
  ✅ SSL status monitoring
  ✅ Multiple domains per tenant support
```

#### Oy 3: Brand engine
```
Hafta 11: Brand customization
  ✅ tenant_brands migration (logo, colors, fonts)
  ✅ Filament "Brand Studio" page
  ✅ Live preview
  ✅ MinIO logo upload

Hafta 12: Theme templates
  ✅ Theme: Modern (default)
  ✅ Theme: Classic
  ✅ Theme: Minimal
  ✅ Per-template tenant data binding

Hafta 13: PWA optimization
  ✅ Per-tenant manifest.json
  ✅ Offline-first menu cache
  ✅ "Add to Home Screen" prompt

Hafta 14: Self-service onboarding
  ✅ /get-started wizard (5 qadam, 10 daqiqa)
  ✅ AI menu generator (Anthropic API)
  ✅ Click subscription billing
  ✅ Free tier auto-activation
```

**Phase 2 yakunida:**
- ✅ jomeburger.uz LIVE bo'la oladi
- ✅ Restoran egasi o'z brand'ini sozlay oladi
- ✅ 10 daqiqada yangi restoran setup
- ✅ Pro tier ($90/oy) ishlamoqda

---

### 🔵 Phase 3: Native App Builder (Oy 4-7)

**Maqsad:** Restoranlar o'z brendlangan iOS/Android app'iga ega bo'la oladi.

#### Oy 4: Apple ekosistema
```
Hafta 15-16: Apple Developer
  ✅ MyPOS Inc. master account ($99/yil)
  ✅ "Develop apps for clients" enrollment
  ✅ Apple Pro Support kelishuv
  ✅ App Store Connect API integratsiya

Hafta 17-18: Google Play
  ✅ MyPOS LLC Google Play Console ($25)
  ✅ Internal testing track
  ✅ Play Console API integratsiya
```

#### Oy 5: EAS Build pipeline
```
Hafta 19: Per-tenant config generator
  ✅ Template repo: mobile-consumer-template
  ✅ app.json injection
  ✅ Asset processing (icon, splash, adaptive icon)
  ✅ Bundle ID validation

Hafta 20: GitHub Actions workflow
  ✅ trigger from Filament UI
  ✅ EAS Build execution
  ✅ Status webhook → Filament

Hafta 21: EAS Submit automation
  ✅ App Store upload (auto)
  ✅ Play Store upload (auto)
  ✅ Review status monitoring

Hafta 22: First app live
  ✅ Demo Restaurant native app (test)
  ✅ Apple Review pass ✓
  ✅ Play Store live ✓
```

#### Oy 6: Production rollout
```
Hafta 23-24: Beta program
  ✅ 5 ta early adopter restoran
  ✅ End-to-end app generation
  ✅ Feedback va bug fix

Hafta 25-26: Plus tier launch
  ✅ Marketing landing page
  ✅ Pricing va billing
  ✅ Customer Success documentation
```

#### Oy 7: Polish
```
Hafta 27-30:
  ✅ Push notifications per-app
  ✅ Deep linking (jomeburger://)
  ✅ App Clips (iOS)
  ✅ Firebase analytics integration
  ✅ Monitoring dashboard
```

**Phase 3 yakunida:**
- ✅ Native white-label apps avtomatik build qilinadi
- ✅ 7 kunda yangi restoran o'z app'iga ega
- ✅ Plus tier ($300/oy) ishlamoqda
- ✅ 50-100 ta restoran native app'i bor

---

### 🟣 Phase 4: Scale + Region (Oy 8-12)

**Maqsad:** O'zbekistonda dominant pozitsiya + Markaziy Osiyoga kengayish.

```
Oy 8-9: Marketplace mobile apps
  ✅ "MyPOS" iOS+Android app (consumer marketplace)
  ✅ Geolocation + restoran search
  ✅ Universal MyPOS Wallet (cross-tenant loyalty)

Oy 10-11: AI features
  ✅ AI ovqat tavsiya
  ✅ Demand forecasting (qaysi ovqat ko'p sotiladi)
  ✅ Auto-translation UZ ↔ RU ↔ EN ↔ KZ
  ✅ Customer service chatbot

Oy 12: Markaziy Osiyo
  ✅ Qozogiston (Astana, Almaty) — KZT, qozoq tili
  ✅ Qirgiziston (Bishkek) — KGS, qirg'iz tili
  ✅ Tojikiston (Dushanbe) — TJS, tojik tili
  ✅ Multi-region infrastructure
  ✅ Local payment providers (Kaspi, ApelSin, etc.)
```

**Phase 4 yakunida (Oy 12):**
- ✅ 1,000+ to'lovchi restoran
- ✅ 100K+ MAU
- ✅ $1M+ ARR
- ✅ 4 ta mamlakat
- ✅ Series A funding ready

---

## 👥 5. Jamoa va resurs talablari

### 5.1 Minimal jamoa (MVP — Phase 0+1)

| Rol | Soni | Oylik maosh | 6 oy total |
|---|---|---|---|
| Senior Backend (Laravel) | 1 | $2,500 | $15,000 |
| Senior Frontend (Next.js+Expo) | 1 | $2,500 | $15,000 |
| DevOps | 0.5 | $1,500 | $4,500 |
| Designer (UI/UX) | 0.5 | $1,200 | $3,600 |
| Product Manager (siz) | 1 | (ekuiti) | — |
| **Total** | **4** | | **$38,100** |

### 5.2 To'liq jamoa (Phase 2+3)

| Rol | Soni | Oylik maosh | 12 oy total |
|---|---|---|---|
| Senior Backend | 2 | $2,500 | $60,000 |
| Senior Frontend | 2 | $2,500 | $60,000 |
| DevOps + SRE | 1 | $2,500 | $30,000 |
| Designer (UI/UX) | 1 | $1,800 | $21,600 |
| QA Engineer | 1 | $1,500 | $18,000 |
| Customer Success | 1 | $1,200 | $14,400 |
| Product Manager | 1 | $2,000 | $24,000 |
| **Total** | **9** | | **$228,000** |

### 5.3 Infratuzilma xarajatlari (oyiga)

```
UZCLOUD VPS (production):    $300
Coolify Cloud (orchestration): $50
Cloudflare (CDN+DNS):        $20
Sentry (error tracking):     $26
Plausible Analytics:         $19
EAS Build subscription:      $99
Apple Developer:             $99/yil
Google Play Console:         $25 bir martalik
SendGrid (email):            $20
Eskiz SMS:                   $0.05/sms
Anthropic Claude API:        ~$200 (changing)
─────────────────────────────────
Oylik (taxminan):            $750
Yillik:                      $9,000
```

### 5.4 Marketing va boshqa

```
Pre-launch marketing:        $30,000
Launch campaign:             $50,000
Influencer marketing:        $20,000
SEO + Content:               $20,000/yil
Sales outreach:              $40,000/yil
─────────────────────────────────
Year 1 marketing total:      $160,000
```

### 5.5 Boshlang'ich kapital (12 oy)

```
Mehnat haqi (4 → 9 odam):    $300,000
Infratuzilma:                $9,000
Marketing:                   $160,000
Yuridik + akkountant:        $20,000
Office (yoki remote):        $10,000
Reserve (10%):               $50,000
─────────────────────────────────
TOTAL Year 1:                $549,000
```

**Funding strategiyasi:**
- Pre-seed (Year 1 boshi): $300-500K
- Seed (Year 1 oxiri / Year 2 boshi): $2-5M
- Series A (Year 2 oxiri / Year 3 boshi): $10-20M

---

## 🤖 6. Agent'lar foydalanish strategiyasi

Loyihaning har qismi uchun ixtisoslashgan agent:

| Agent | Vazifa | Phase |
|---|---|---|
| `security-auditor` | Xavfsizlik audit (har sprint oxirida) | Hammasi |
| `performance-auditor` | Performance audit (Phase 1+ oxirida) | 1, 2, 3 |
| `db-migration-author` | RLS migration, tenant_domains, brands | 0, 2 |
| `laravel-backend-dev` | Policy classes, Custom Domain backend | 0, 2 |
| `filament-resource-dev` | Brand Studio, Domain wizard, App builder UI | 2, 3 |
| `nextjs-page-dev` | web-consumer real API, theme templates | 1, 2 |
| `expo-screen-dev` | mobile-consumer wiring, native app template | 1, 3 |
| `i18n-translator` | UZ/RU/EN/KZ keylar (har sprint) | Hammasi |
| `test-writer` | Pest, Vitest, Playwright tests (har feature) | Hammasi |
| `api-contract-keeper` | OpenAPI ↔ TS SDK sync (har endpoint qo'shilganda) | 1, 2, 3 |

**Workflow:**
```
Feature spec → Plan agent → Implementation agents (parallel) →
Test-writer → Security-auditor → Performance-auditor → Merge
```

---

## 🎯 7. Phase 0 — Bugundan boshlanadigan ish

### Qadam-baqadam (15 ish kuni / 3 hafta)

#### Hafta 1: DB + Backend xavfsizlik
- **Day 1-2 (db-migration-author):** RLS migration 30+ jadvalga
- **Day 3 (laravel-backend-dev):** BelongsToTenant scope hardening
- **Day 4 (laravel-backend-dev):** Payment webhook stub fix
- **Day 5 (laravel-backend-dev):** Demo seeder guards

#### Hafta 2: Authorization
- **Day 6-7 (laravel-backend-dev):** 10 ta Policy class
- **Day 8 (laravel-backend-dev):** Token ability cleanup
- **Day 9 (laravel-backend-dev):** PII encryption casts
- **Day 10 (test-writer):** Pest tests 80%+ coverage

#### Hafta 3: Re-audit + Polish
- **Day 11 (security-auditor):** Re-audit
- **Day 12-13:** Topilgan xatolarni tuzatish
- **Day 14 (performance-auditor):** Performance baseline
- **Day 15:** Phase 0 yakuni — Phase 1 ga o'tish

### Acceptance criteria (Phase 0 oxirida)

```
✅ security-auditor: 0 ta CRITICAL, 0 ta HIGH
✅ performance-auditor: 0 ta CRITICAL
✅ Pest test coverage: 80%+
✅ Hamma 6 ta audit muammo: tuzatildi
✅ Production-safe deployment dock-checklist
```

---

## 📊 8. KPI'lar va metrikalar

### Texnik KPI

| Metric | Target | Aktual (hozir) |
|---|---|---|
| API p99 latency | < 200ms | ? |
| Web FCP | < 1.5s | ? |
| Mobile cold start | < 2s | ? |
| Test coverage | > 80% | ~? |
| Uptime | 99.9% | — |
| Security CRITICAL | 0 | **6** ❌ |
| Security HIGH | 0 | **8** ❌ |

### Biznes KPI

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| To'lovchi restoran | 500 | 3,000 | 10,000 |
| MAU | 100K | 500K | 1M |
| ARR | $1M | $5M | $15M |
| MRR/customer | $50 | $80 | $120 |
| Churn | < 5%/oy | < 3%/oy | < 2%/oy |
| NPS | > 30 | > 50 | > 60 |

---

## ⚖️ 9. Riskli joylar va yumshatishlar

### 9.1 Texnik risklar

| Risk | Ehtimollik | Ta'sir | Yumshatish |
|---|---|---|---|
| Apple "Develop apps for clients" qabul qilmaslik | O'rta | YUQORI | Phase 3 boshida Apple bilan to'g'ri munosabat, Olo case study'larini ulashing |
| RLS implementation murakkab | O'rta | O'RTA | db-migration-author + Pest tests, prod'ga deploy bosqichma-bosqich |
| Custom domain SSL hatolari | Past | O'RTA | Caddy battle-tested, ko'p platforma ishlatadi |
| Multi-tenant performance degradatsiyasi | O'rta | YUQORI | Performance audit har sprint, partition'lar |

### 9.2 Biznes risklar

| Risk | Ehtimollik | Ta'sir | Yumshatish |
|---|---|---|---|
| Yandex Eda/Glovo'ga raqobatda yengilish | YUQORI | YUQORI | White-label = ular bera olmagan narsa, raqobat qilmaymiz |
| Restoranlar pul to'lashga tayyor bo'lmaslik | O'rta | YUQORI | Free tier (komissiya bilan) avval, keyin upgrade |
| Click/Payme integratsiya qiyinligi | Past | YUQORI | Mahalliy expert ulanish, allaqachon kod tayyor |
| Funding topa olmaslik | O'rta | KRITIK | Bootstrap MVP avval, traction kelganda raise |

### 9.3 Tartibga solish (Compliance)

```
✅ O'zbekiston "Personal Data" qonuni (PII encryption)
✅ Click/Payme regulyator talablari
✅ Apple/Google App Store guidelines
⚠️ GDPR (kelajakda Yevropa kengayishi uchun)
⚠️ PCI DSS (agar to'g'ridan-to'g'ri karta ma'lumoti saqlasangiz — saqlamaymiz)
```

---

## 🚦 10. Endi nima qilamiz? (Decision tree)

```
                    ┌────────────────┐
                    │ Plan tasdiqlash│
                    │   (siz qaror)  │
                    └────┬───────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           [HA, davom]            [O'zgartirish]
              │                     │
              ▼                     ▼
     ┌──────────────────┐    ┌──────────────────┐
     │ PHASE 0 START    │    │ Plan revision    │
     │ ──────────────── │    │ qaysi qismni     │
     │ Day 1-2:         │    │ o'zgartirish     │
     │ RLS migration    │    │ kerak?           │
     │ db-migration-... │    └──────────────────┘
     └──────────────────┘
```

### Tasdiqlangach quyidagilarni boshlayman:

1. **Bugun (Day 1):** db-migration-author agent → RLS migration draft
2. **Ertaga (Day 2):** RLS migration test + apply
3. **Day 3-15:** Phase 0 to'liq yakuniga yetkazish
4. **Day 16+:** Phase 1 boshlanadi

---

## 📋 Qo'shimcha hujjatlar (kelajakda yoziladi)

```
docs/
├── adr/                              ← Architecture Decision Records
│   ├── 0001-multi-tenancy-rls.md
│   ├── 0002-custom-domain-routing.md
│   ├── 0003-eas-build-pipeline.md
│   └── 0004-tier-pricing.md
├── api/                              ← OpenAPI spec
│   └── openapi.yaml
├── architecture/                     ← Tizim arxitekturasi
│   ├── overview.md
│   ├── data-model.md
│   └── deployment.md
└── guides/                           ← Foydalanuvchi qo'llanmalar
    ├── tenant-onboarding.md
    ├── custom-domain-setup.md
    └── native-app-build.md
```

---

## ✍️ Tasdiqlash

**Plan muallifi:** Claude (AI assistant)
**Tasdiqlovchi:** _________________ (siz)
**Tasdiq sanasi:** _________________

**Ushbu plan tasdiqlangach:**
- ✅ Phase 0 darhol boshlanadi
- ✅ Har sprint (1 hafta) yakunida progress hisobot
- ✅ Har Phase yakunida security + performance audit
- ✅ Plan o'zgarishlari: ADR yoziladi

---

> **Eslatma:** Bu plan tirik hujjat. Bozor sharoitlari, foydalanuvchi feedback'i, va texnik kashfiyotlarga qarab moslashtirilishi mumkin. Asosiy maqsadlar (custom domain, native app, hybrid model) o'zgarmaydi.
