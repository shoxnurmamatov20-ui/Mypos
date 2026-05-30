# MyPOS — To'liq Loyiha Ko'rigi (Full Project Review)

> **Sana:** 2026-05-29
> **Qamrov:** 100% — barcha app, package, infra, docs, legacy (`node_modules`/`vendor`/`.next`/`dist` bundan mustasno — bular bog'liqlik/build artefaktlari)
> **Metod:** 30 ta parallel agent · **1,531 manba fayl o'qildi** · **480 ta topilma**
> **Muallif:** Claude Code (multi-agent workflow review)

---

## 0. Xulosa (Executive Summary — UZ)

MyPOS — Markaziy Osiyo uchun **ko'p-ijarali (multi-tenant) Restaurant Operating System SaaS**. Backend **Laravel 12 + PHP 8.5 + MySQL 8.4**, 8 ta Next.js 15 web-panel, 5 ta Expo mobil app, KDS, kiosk, POS-terminal va Telegram bot. Arxitektura **professional darajada** — toza DDD domen tuzilishi, `BelongsToTenant` "fail-closed" tenant izolyatsiyasi, PII shifrlash, ability-scoped Sanctum tokenlar, audit log, Reverb real-time.

**Lekin loyiha "demo/skelet" bosqichidan "production" bosqichiga hali o'tmagan.** Asosiy muammolar:

1. **Xavfsizlik (Critical/High):** Backend kontrollerlarda authorization yo'q (cross-tenant IDOR), staff uchun wildcard `*` token, mock parollar client bundle ichida, tokenlar `localStorage` + URL-hash orqali (XSS bilan o'g'irlanadi).
2. **Ko'p funksiya ishlamaydi:** Web-cashier "Charge" tugmasi, web-ceo'ning 3 sahifasi (yo'q export'lar), marketing formalari (backend'ga yubormaydi), onboarding (tenant yaratmaydi), Payme to'lovi (birlik xatosi) — foydalanuvchiga ishlayotgandek ko'rinadi, aslida hech narsa saqlanmaydi.
3. **Type-safety o'chirilgan:** ~7 ta Next.js app'da `typescript.ignoreBuildErrors:true` — TS xatolar CI'da yashiriladi.
4. **Test qamrovi:** Ko'p app'da **0 test** (CLAUDE.md 80% talab qiladi); backend'da 112+ skip qilingan test; `phpunit.xml` o'lik PostgreSQL'ga ishora qiladi.
5. **Hujjat ≠ reallik (drift):** Docs "14 app / 16 domen / PostgreSQL+RLS" deydi — reallik **18 app / 22 domen / MySQL (RLS yo'q)** + hujjatlanmagan **klinika (ShifoReyting) vertikali**.

Bularning hammasi tuzatiladigan, lokatsiyalari aniqlangan muammolar. Quyida to'liq tafsilot.

---

## 1. Tizim haqiqatda nima (What MyPOS actually is)

MyPOS dastlab restoran POS sifatida boshlangan, lekin hozir **ikki vertikalli SaaS**:

- **Restoran OS** (asosiy): buyurtma, menyu, stol, inventar/ombor, xodim/smena, kuryer, sodiqlik (loyalty), to'lov (Click/Payme/naqd), KDS, kiosk, QR-menyu, AI (Claude — menyu generatsiyasi, talab prognozi, chatbot, tarjima).
- **Klinika / ShifoReyting** (yangi, hujjatlanmagan): `Clinic`, `Doctor`, `Visit`, `Department` domenlari + web-ceo panelidagi `doctors`/`tokens`/`feedback` sahifalari. Bir xil backend va `tenant_owners` mexanizmini ulashadi.

Rol ierarxiyasi: **Super Admin** (MyPOS jamoasi) → **CEO** (bir nechta restoran/klinika egasi) → **Manager** (1 ta) → xodimlar (kassir/ofitsiant/oshpaz/kuryer). 4 tarif: Free / Pro $90 / Plus $300 / Enterprise $1500+ (Plus — har bir tenant uchun EAS Build orqali native app).

---

## 2. Raqamlarda (Inventory)

| Ko'rsatkich | Hujjatlarda | **Reallikda (disk)** |
|---|---|---|
| Apps | 14 | **18** |
| Backend DDD domenlar | 16 | **22** |
| Packages | 10 | 10 (1 bo'sh: `feature-flags`) |
| Migrations | 65 | **76** |
| Database | PostgreSQL 17 + RLS | **MySQL 8.4 (RLS yo'q)** |
| Dizayn | Faqat Apple | **Apple+coral / dark+teal ikki tizim** (tasdiqlangan) |
| O'qilgan fayllar | — | **1,531** |
| Topilgan muammolar | — | **480** (28 critical · 113 high · 194 medium · 108 low · 37 info) |

**18 app:** `api` · web: `web-marketing, web-dashboard, web-superadmin, web-consumer, web-qr, web-ceo, web-cashier, web-portal` · `kds` · mobil: `mobile-consumer, mobile-consumer-template, mobile-staff, mobile-courier, mobile-portal` · `kiosk` · `pos-terminal` · `telegram-bot`.

---

## 3. Arxitektura — qatlam bo'yicha (verified current state)

### 3.1 Backend (`apps/api`, ~1113 fayl)
Toza DDD: `app/Domain/<Domain>/{Models,Actions,Services,Enums,Events,Policies,DataTransferObjects,...}`. Kontrollerlar yupqa — Action/Service'larga delegatsiya qiladi.

- **Multi-tenancy:** `Shared/Concerns/BelongsToTenant.php` global scope — **fail-closed** (tenant konteksti yo'q bo'lsa `WHERE 1=0`). RLS olib tashlangach (ADR-0005), bu **yagona** himoya qatlami. `withoutGlobalScopes()` SuperAdmin/CEO/Kiosk/Webhook'larda ataylab ishlatiladi (CEO `ownedTenantIds()` bilan chegaralaydi).
- **Auth:** Sanctum, ability'lar bilan (`tenant:full` 7-kun, `super-admin` 1-soat, `impersonated:read` 15-daqiqa read-only). `EnsureSuperAdmin` wildcard tokenni rad etadi. Staff — phone+PIN.
- **Pul:** `Shared/ValueObjects/Money.php` (bcmath, banker's rounding, minor-unit). `MoneyCast`. FX: CBU/NBKR/NBP/Fixer.
- **To'lov:** Strategy pattern — `PaymentManager` → `ClickProvider`/`PaymeProvider`/`CashProvider`. Webhook'lar HMAC/IP-allowlist bilan.
- **AI:** Anthropic Claude (HTTP, SDK'siz) — `DemandForecastService`, `ChatbotService`, `AiQuotaGuard`, `GenerateMenuAction`, `AutoTranslateAction`.
- **Real-time:** Reverb — tenant kanal nomida kodlangan (`tenant.{id}.kitchen`, `tenant.{id}.dashboard`).
- **Filament:** 22 Resource + 3 Page (AIStudio/AppBuilder/BrandStudio) + 8 Widget. `/admin`.
- **Routing:** `routes/api.php` **751 satr** (≤400 qoidasini buzadi), auth-surface bo'yicha guruhlangan.

### 3.2 Web (Next.js 15 + React 19, 8 app)
App Router, `[locale]` (UZ/RU/EN/KZ, next-intl), TanStack Query, Zustand, Tailwind 4, `@mypos/api-client`. Har biri `/panel/<role>` basePath ostida. **Dizayn:** consumer/marketing/ceo — Apple+coral; qolganlari — dark+teal (`#0f766e`). Auth: universal portal'dan `#token=` fragment → `localStorage`.
- **Yetuk:** web-superadmin (lekin mock-fallback bilan), web-dashboard (struktura to'liq), web-consumer (UI to'liq, lekin backend ulanmagan ko'p joyda), web-marketing (Apple migratsiya yakunlangan).
- **Yarim/demo:** web-cashier (charge ishlamaydi), web-ceo (3 sahifa buzilgan), web-portal (waiter paneli mock), web-qr (PWA manifest noto'g'ri).

### 3.3 Mobile (Expo SDK 54, 5 app + 2 maxsus)
Expo Router 6, NativeWind, i18next, secure-store. `mobile-consumer` (mijoz), `mobile-staff` (ofitsiant+oshpaz, PIN), `mobile-courier` (kuryer), `mobile-portal` (universal SSO dispatcher), `mobile-consumer-template` (per-tenant EAS Build shabloni), `kiosk`, `pos-terminal`.
- **Umumiy muammo:** `echo.ts` (Reverb) yozilgan, lekin hech bir ekranga ulanmagan → real-time o'rniga polling. Bir nechta runtime dependency `package.json`da yo'q (`expo-location`, `laravel-echo`, `expo-haptics`).

### 3.4 Packages (10)
`design-tokens` (Apple tizim, source of truth), `api-client` (qo'lda yozilgan — Scribe'dan avto-generatsiya TODO), `types`, `validation` (Zod), `utils`, `ui` (dark+teal primitives), `i18n`, `config` (export'lar bo'sh papkalarga ishora qiladi), `analytics` (stub), `feature-flags` (**butunlay bo'sh**).

### 3.5 Infra / DevOps
`infra/` (docker-compose: redis/meilisearch/minio/caddy), `.github/workflows` (ci.yml, ci-filament.yml). Coolify deploy. **Muammo:** CI hali pgsql'ga ishora qiladigan joylar bor; husky hook fayllari yo'q; Pest `--min-coverage` yo'q.

---

## 4. Kuchli tomonlar (Strengths — balanced view)

Bu loyiha ko'p jihatdan **yuqori sifatli**:

- ✅ **`BelongsToTenant` fail-closed** — tasodifiy cross-tenant leak'dan kuchli himoya (default-deny).
- ✅ **Token gigiyenasi** — ability-scoped, qisqa TTL, super-admin wildcard rad etadi, impersonation read-only + audit.
- ✅ **PII shifrlash** — `Crypt` (phone/email/notes/delivery), HMAC `phone_index` orqali O(log n) qidiruv.
- ✅ **Money value object** — bcmath, banker's rounding, valyuta-tekshiruvli arifmetika.
- ✅ **Webhook hardening** — EAS replay-protection (Redis 7-kun TTL), Click/Payme imzo, `hash_equals`, kiosk SHA-256 token.
- ✅ **Rate limiting** — PIN login per-phone 5/15min.
- ✅ **Audit log** — append-only, aktyor/IP/user-agent avto-aniqlash.
- ✅ **Mass-assignment intizomi** — `tier`/`feature_flags` `$fillable`dan chiqarilgan.
- ✅ **Backend test intizomi** (mavjud joyda) — `strict_types`, security/RLS/PII/policy testlari, N+1 guard-rail testlari.
- ✅ **i18n infratuzilmasi** — 4 til, `domain.section.key` konvensiyasi.

---

## 5. KRITIK muammolar (28 ta) — darhol tuzatish kerak

### Xavfsizlik
1. **Wildcard `*` Sanctum token** — `StaffPinLoginAction.php:64` 30-kunlik `['*']` token beradi. O'g'irlangan token har qanday endpoint'ga kiradi. → `['staff:full']` qiling.
2. **Authorization yo'q — cross-tenant IDOR:** `TableController`/`TableCategoryController` (10 metod) va `EmployeeController`/`ShiftController`/`ClockController` da bironta `$this->authorize()` yo'q. Har qanday autentifikatsiyalangan foydalanuvchi (boshqa tenant'dan ham) xodim/stol yaratishi/o'chirishi mumkin (`api.php:355-381`).
3. **Mock super-admin parol bundle'da:** `web-superadmin/src/stores/auth.ts:29-31` — `superpass123` + `mock-super-admin-token` production bundle ichida; backend o'chgan bo'lsa kirishga ruxsat beradi.
4. **Mock parollar (web-portal):** `LoginForm.tsx:22-29` — `admin123/ceo123/demo123` client JS'da.
5. **Token URL-fragment injection:** `web-dashboard/auth-guard.tsx:23-30` — `#token=` ni validatsiyasiz `localStorage`ga yozadi → force-login vektori. (web-superadmin/web-portal/web-ceo/mobile-portal'da ham.)
6. **Deep-link token o'g'irlanishi:** `mobile-portal/deeplink.ts:61` — bearer token query-string'da; sxema ro'yxatdan o'tgan har qanday app ushlab oladi.

### Pul / to'lov
7. **Payme buzilgan:** `PaymeProvider.php:195` — `total_amount === amount` to'g'ridan-to'g'ri solishtiriladi, lekin Payme tiyin (UZS×100) yuboradi. Production'da har bir Payme to'lovi "Amount mismatch" bilan rad etiladi.
8. **pos-terminal noto'g'ri API:** barcha to'lov usullari (karta/Click/Payme) `captureCash()` chaqiradi (`PaymentModal.tsx:252`).

### Ishlamaydigan funksiyalar (foydalanuvchi "ishladi" deb o'ylaydi, aslida yo'q)
9. **web-cashier "Charge"** — backend'ga yubormaydi, faqat lokal `clear()` (`cart-panel.tsx:37`).
10. **web-ceo 3 sahifa buzilgan** — `api.ts`da yo'q ~18 export import qilinadi (Doctors/Tokens/Feedback) → runtime crash, `ignoreBuildErrors` yashiradi.
11. **web-marketing get-started** — "Akkaunt yaratish" API'ga POST qilmaydi (`get-started-flow.tsx:489`); contact/demo/newsletter formalari ham (silent data-loss).

### Konfiguratsiya / CI
12. **`phpunit.xml` pgsql:55432** — ADR-0005 (MySQL) ga zid; test suite o'lik PostgreSQL'ga ishlaydi.
13. **`typescript.ignoreBuildErrors:true`** — web-dashboard, web-consumer, web-marketing, web-ceo, web-cashier, web-portal, web-qr, kds.

### Bo'sh / o'lik
14. **`packages/feature-flags`** — butunlay bo'sh (package.json ham yo'q); import qilgan app build'da yiqiladi.
15. **Committed `.env`:** `apps/kiosk/.env` (real LAN IP) git'da.

### Test
16. **0 test:** web-cashier, web-qr, kds (+ §6'da yana ko'p).
17. **Filament 0 test** — 22 Resource/8 Widget/3 Page umuman test qilinmagan.

### Legacy (`_legacy-2026-04`) — **hech qachon qayta deploy qilinmasin**
18. `backend/src/routes/ai.js` — parol/PIN'larni LLM'ga ataylab oshkor qiladi, `/execute` autentifikatsiyasiz CRUD.
19. `backend/.env` git'da — `JWT_SECRET=mypos_secret_key_2025`.
20. `employees.json` — xodim parollari **ochiq matnda** (real odamlar).

> Qolgan 8 ta critical (web-consumer/web-ceo/mobile-portal/kds .env.local/legacy mainadmin va h.k.) — to'liq ro'yxat: `_review-issues.md`.

---

## 6. YUQORI (High, 113 ta) — takrorlanuvchi mavzular

| Mavzu | Qayerda | Tavsiya |
|---|---|---|
| **Token `localStorage`da** (XSS exfiltration) | barcha web + mobile | httpOnly cookie yoki short-lived exchange |
| **Mock-fallback auth xatoni yashiradi** (401/403 → demo data) | web-superadmin, web-cashier | faqat network-error'da fallback |
| **Backend authz yo'q** | `InventoryReportController::valuation()` (waiter ham ko'radi) | `$this->authorize()` + pagination |
| **Race condition** | `generateOrderNo()`, `generateEmployeeCode()`, doc-no | unique index + lock/retry |
| **Real-time ulanmagan** | mobile-staff/courier/pos `echo.ts` ishlatilmaydi | hook'larga ulash yoki o'chirish |
| **Yo'q runtime deps** | mobile-courier (`expo-location`,`laravel-echo`), mobile-staff (`expo-haptics`) | `package.json`ga qo'shish |
| **i18n hardcode** | `CreateOrderAction`, kds (butunlay), pos-terminal, marketing footer, `NotificationTemplate` | `__()` / `useTranslations` |
| **Fayl o'lchami >400/>200** | audit-view (789), TokensClient (880), FeedbackClient (838), get-started-flow (722), api.php (751), sidebar (492) | bo'lish |
| **`withoutGlobalScopes` `unguard`siz** | `DemoOrdersSeeder`, Filament `MenuCategoryResource` preload (cross-tenant dropdown leak) | `SuperAdminScope::unguard()` |
| **Config MySQL'da xavfli** | `queue.php`/`failed` default `sqlite`, `multitenancy.php` noto'g'ri model, `env()` `AppServiceProvider:212`, Payme `test_mode=true` | config'da aniq qiymat |
| **0 test** | web-ceo, web-dashboard, mobile-staff, mobile-portal, kiosk, pos-terminal, telegram-bot, barcha packages | Vitest/Maestro/Pest |
| **Skelet endpoint** | `OnboardingController::submit()` TODO (marketing wizard ulangan, lekin tenant yaratmaydi) | `ProvisionTenantAction` |
| **Bo'sh domen/package** | `Restaurant`, `Doctor` domenlari, `Notification` (sender yo'q), `Billing`, `packages/config` exports | implementatsiya yoki olib tashlash |
| **Apple dizayn buzilishi** | Filament primary = Amber, mobile-courier `font-medium`/`shadow-md`, pos-terminal/cashier hardcoded hex + aniqlanmagan dark token'lar | token'lardan foydalanish |
| **Telegram cross-customer leak** | `orders.ts` barcha mijozlar buyurtmasini ko'rsatadi | user bo'yicha filtr |

---

## 7. Hujjat ≠ Reallik (Drift katalogi)

Agentlar/dasturchilar uchun xavfli, chunki eski hujjatga ishonib xato qaror qabul qilinishi mumkin:

- `docs/architecture/README.md` hali **"PostgreSQL 17 + RLS"** deydi — ADR-0005 (2026-05-10) ikkalasini ham olib tashlagan. **Tenant izolyatsiyasi DB qatlamida YO'Q** — faqat `BelongsToTenant`.
- `MYPOS_MASTER_PLAN.md` / `loyiha-strukturasi` — **14 app / 16 domen** deydi; reallik **18 / 22**.
- **Klinika (ShifoReyting) vertikali** — `Clinic/Doctor/Visit/Department` domenlari + web-ceo sahifalari **hech qaerda hujjatlanmagan**. Cross-vertikal ma'lumot izolyatsiyasi xavfi tahlil qilinmagan.
- `CLAUDE.md` Rule 11 "faqat Apple" deydi; amalda **Apple+coral / dark+teal ikki tizim** (DECISIONS 2026-05-14'da tasdiqlangan — bu **qoidabuzarlik emas**, lekin CLAUDE.md yangilanishi kerak).
- `.claude/settings.local.json` (commit qilingan) ichida **ochiq MySQL paroli** `Yoqubjon20022006` — gitignore'ga olinishi va parol almashtirilishi kerak.

---

## 8. Tavsiyalar (Roadmap to production)

**P0 — Xavfsizlik (1 sprint):**
1. Staff token'ni scope qilish (`*` → `staff:full`).
2. Barcha backend kontrollerlarga `authorize()` + policy (Table/Employee/Shift/Clock/InventoryReport).
3. Barcha mock/demo parollarni client'dan olib tashlash; mock-fallback'ni faqat network-error'ga cheklash.
4. SSO token uzatishni `#fragment`/`localStorage`dan short-lived exchange-code (PKCE) ga o'tkazish.
5. Committed `.env`/parollarni o'chirish + rotate + `.gitignore`.

**P1 — Funksional to'liqlik:**
6. Payme birlik xatosi (tiyin/soum), Uzum/Apelsin provider, IP-allowlist fail-closed.
7. Ishlamaydigan UI'larni backend'ga ulash (cashier charge, ceo sahifalar, marketing forms, onboarding, consumer orders/loyalty, mobile push/cancel, kiosk QR/call-staff).
8. mobile `echo.ts` real-time ulash; yo'q deps qo'shish.

**P2 — Sifat / CI:**
9. `phpunit.xml` → MySQL; CI'da pgsql qoldiqlarini tozalash; `--min-coverage=80`; husky hook'lar.
10. Har bir Next app'da `ignoreBuildErrors:false` qilib TS xatolarni tuzatish.
11. Test yozish (0-test app'lar + Filament).
12. >400/>200 satrli fayllarni bo'lish.

**P3 — Tozalash / hujjat:**
13. Bo'sh domen/package'lar (`Restaurant`, `Doctor`, `Billing`, `feature-flags`, `packages/config` exports) — implement yoki o'chirish.
14. Hujjatlarni reallikka moslash (DB, app/domen soni, klinika vertikali, dizayn dichotomiyasi).
15. `landlord/` o'lik migration, `database.sqlite`, o'lik komponentlar (dashboard-home, mobile-courier orphan EarningsCard) ni o'chirish.

---

## Ilovalar (Appendices)
- **To'liq muammolar ro'yxati (480, severity-sorted):** workflow natijasidan generatsiya qilingan `_review-issues.md`.
- **Soha-bo'yicha xulosalar (30):** `_review-areas.md`.
- **Tegishli ADR:** ADR-0003 (PostgreSQL, REVERSED), ADR-0005 (MySQL revert), `DECISIONS.md` (dizayn dichotomiyasi, port mapping, rol ierarxiyasi).
