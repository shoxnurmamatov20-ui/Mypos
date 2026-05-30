# 🔌 API ENDPOINTS — TO'LIQ KATALOG

> Manba: `apps/api/routes/api.php` (594 qator)
> Versiya: **v1** — `/api/v1/*`
> Auth: **Laravel Sanctum** (Bearer token)
> Real-time auth: **POST /api/broadcasting/auth** (Reverb)

---

## 📊 STATISTIKA

| Element | Qiymat |
|---|---|
| Jami endpointlar | **~135** |
| Auth talab qilmaydi (public) | ~30 |
| Auth talab qiladi (authenticated) | ~105 |
| Webhook (no-auth, IP allowlist) | 3 |
| Internal (Caddy) | 1 |
| Throttling — eng qattiq | `5/min` (public order) |
| Throttling — eng yumshoq | `600/min` (Caddy verify) |
| Reverb broadcasting auth | 1 |

---

## 🌍 1. PUBLIC (Auth talab qilmaydi)

### 1.1 Sog'liq tekshiruvi
| Method | Path | Throttle | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | API status, version, locale, timezone |

### 1.2 Marketplace (Restaurants + Menu)
| Method | Path | Throttle | Controller |
|---|---|---|---|
| GET | `/api/v1/public/restaurants` | 60/min | `PublicRestaurantController@index` |
| GET | `/api/v1/public/restaurants/{slug}` | 60/min | `PublicRestaurantController@show` |
| GET | `/api/v1/public/menu/{slug}` | 60/min | `PublicMenuController@show` (cached + ETag) |
| GET | `/api/v1/public/resolve-domain` | 120/min | `PublicResolveDomainController` (custom domain → tenant) |

### 1.3 Guest checkout (no-auth)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/v1/public/orders` | **5/min** | Per-IP — eng qattiq |
| GET | `/api/v1/public/orders/track/{token}` | 30/min | Tracking token bilan kuzatish |
| POST | `/api/v1/public/menu/{slug}/orders` | 30/min | Legacy QR menu PWA endpoint |

### 1.4 Multi-currency reference (Phase 4)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| GET | `/api/v1/public/currencies` | 60/min | 1h Redis + 10m browser cache |
| GET | `/api/v1/public/exchange-rates?from=USD&to=UZS&date=YYYY-MM-DD` | 60/min | FxRateService fallback chain |

### 1.5 AI Chatbot (Phase 4 — Plus+ tier)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/v1/public/chat` | **30/hour** | `ResolveTenantFromDomain` middleware |

### 1.6 Onboarding wizard (5-step)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/v1/public/onboarding/start` | 5/15min | |
| POST | `/api/v1/public/onboarding/menu-generate` | 10/hour | AI quota |
| POST | `/api/v1/public/onboarding/submit` | 5/15min | |

---

## 💳 2. PAYMENT WEBHOOKS (No auth, IP allowlist)

| Method | Path | Throttle | Middleware | Notes |
|---|---|---|---|---|
| POST | `/api/v1/webhooks/click` | 60/min | `payment.webhook.ips:click` | Click webhook |
| POST | `/api/v1/webhooks/payme` | 60/min | `payment.webhook.ips:payme` | Payme webhook |
| POST | `/api/v1/webhooks/eas-build` | 120/min | HMAC-SHA1 signature | EAS Build webhook (`expo-signature`) |

> **Security (C3):** IP allowlist + rate limit + signature verification. Stub-mode reject in production.

---

## 🏪 3. KIOSK (Device token auth)

### 3.1 Pairing (public, rate-limited)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/v1/kiosk/pair` | 10/15min | Pairing code orqali |

### 3.2 Device token bilan
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/kiosk/heartbeat` | Live status update |
| GET | `/api/v1/kiosk/menu` | Menu sync |
| POST | `/api/v1/kiosk/orders` | Order yaratish |
| GET | `/api/v1/kiosk/orders/{order}` | Order status |
| POST | `/api/v1/kiosk/payment-intent` | Payment intent yaratish |
| POST | `/api/v1/kiosk/payment-intent/{payment}/capture` | Payment capture |

> **Middleware:** `kiosk.device` — KioskDevice modelda bound qiladi.

---

## 🔐 4. AUTH

### 4.1 Public login
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 10/min | Email + password (manager/owner) |
| POST | `/api/v1/auth/staff-login` | 30/min | Phone + PIN (waiter/cook/courier) |

### 4.2 Authenticated (auth:sanctum)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/auth/logout` | Token revoke |

### 4.3 Reverb broadcasting auth
| Method | Path | Throttle | Notes |
|---|---|---|---|
| POST | `/api/broadcasting/auth` | 120/min | Reverb subscription auth |

---

## 🍽️ 5. MENU (Auth: tenant user)

| Method | Path | Notes |
|---|---|---|
| **Categories** | | |
| GET | `/api/v1/menu/categories` | List |
| POST | `/api/v1/menu/categories` | Create |
| GET | `/api/v1/menu/categories/{category}` | Show |
| PATCH | `/api/v1/menu/categories/{category}` | Update |
| DELETE | `/api/v1/menu/categories/{category}` | Soft delete |
| **Items** | | |
| GET | `/api/v1/menu/items` | List |
| POST | `/api/v1/menu/items` | Create |
| GET | `/api/v1/menu/items/{item}` | Show |
| PATCH | `/api/v1/menu/items/{item}` | Update |
| DELETE | `/api/v1/menu/items/{item}` | Soft delete |

---

## 🪑 6. TABLES (Auth: tenant user)

### 6.1 Categories
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/tables/categories` | List |
| POST | `/api/v1/tables/categories` | Create |
| PATCH | `/api/v1/tables/categories/{tableCategory}` | Update |
| DELETE | `/api/v1/tables/categories/{tableCategory}` | Delete |

### 6.2 Tables
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/tables` | List |
| POST | `/api/v1/tables` | Create |
| GET | `/api/v1/tables/{table}` | Show |
| PATCH | `/api/v1/tables/{table}` | Update |
| PATCH | `/api/v1/tables/{table}/status` | Update status (free/occupied/reserved) |
| DELETE | `/api/v1/tables/{table}` | Delete |

---

## 📦 7. ORDERS (Auth: tenant user)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/orders` | List |
| POST | `/api/v1/orders` | Create |
| GET | `/api/v1/orders/stats/summary` | Dashboard summary (BEFORE `/{order}` route) |
| GET | `/api/v1/orders/{order}` | Show with items |
| PATCH | `/api/v1/orders/{order}/status` | Status transition |

---

## 👥 8. CUSTOMERS (Auth: tenant user)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/customers` | List |
| POST | `/api/v1/customers` | Create |
| GET | `/api/v1/customers/{customer}` | Show + loyalty |
| PATCH | `/api/v1/customers/{customer}` | Update |
| DELETE | `/api/v1/customers/{customer}` | Soft delete |

---

## 👨‍🍳 9. EMPLOYEES + SHIFTS + CLOCK (Auth: tenant user)

### 9.1 Employees
| Method | Path |
|---|---|
| GET | `/api/v1/employees` |
| POST | `/api/v1/employees` |
| GET | `/api/v1/employees/{employee}` |
| PATCH | `/api/v1/employees/{employee}` |
| DELETE | `/api/v1/employees/{employee}` |

### 9.2 Shifts
| Method | Path |
|---|---|
| GET | `/api/v1/shifts` |
| POST | `/api/v1/shifts` |
| DELETE | `/api/v1/shifts/{shift}` |

### 9.3 Clock
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/clock/in` | Clock in |
| POST | `/api/v1/clock/out` | Clock out |

---

## 📦 10. INVENTORY (Auth: tenant user)

### 10.1 Ingredients
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/inventory/ingredients` | List |
| POST | `/api/v1/inventory/ingredients` | Create |
| GET | `/api/v1/inventory/ingredients/{ingredient}` | Show |
| PATCH | `/api/v1/inventory/ingredients/{ingredient}` | Update |
| DELETE | `/api/v1/inventory/ingredients/{ingredient}` | Delete |
| POST | `/api/v1/inventory/ingredients/{ingredient}/adjust` | Stock adjustment |
| GET | `/api/v1/inventory/ingredients/{ingredient}/movements` | Stock movements history |

### 10.2 Recipes
| Method | Path |
|---|---|
| GET | `/api/v1/inventory/recipes` |
| POST | `/api/v1/inventory/recipes` |
| DELETE | `/api/v1/inventory/recipes/{recipe}` |

### 10.3 Reports
| Method | Path |
|---|---|
| GET | `/api/v1/inventory/low-stock` |
| GET | `/api/v1/inventory/valuation` |

---

## 💵 11. PAYMENTS (Auth: tenant user)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/payments` | Create payment |
| GET | `/api/v1/payments/{payment}` | Show |
| POST | `/api/v1/payments/{payment}/capture` | Cash capture |
| POST | `/api/v1/payments/{payment}/refund` | Refund |

---

## 🎛️ 12. SUPER ADMIN (Auth + super-admin middleware)

### 12.1 Auth (Public sub)
| Method | Path | Throttle |
|---|---|---|
| POST | `/api/v1/super-admin/login` | 20/15min |
| POST | `/api/v1/super-admin/admins/accept-invitation` | 5/15min |

### 12.2 Profile
| Method | Path |
|---|---|
| GET | `/api/v1/super-admin/me` |
| POST | `/api/v1/super-admin/logout` |

### 12.3 Dashboard
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/super-admin/dashboard` | KPIs |
| GET | `/api/v1/super-admin/dashboard/charts` | Charts data |

### 12.4 Tenants management
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/super-admin/tenants` | List |
| POST | `/api/v1/super-admin/tenants` | Create |
| GET | `/api/v1/super-admin/tenants/{tenant}` | Show |
| PATCH | `/api/v1/super-admin/tenants/{tenant}` | Update |
| DELETE | `/api/v1/super-admin/tenants/{tenant}` | Delete |
| POST | `/api/v1/super-admin/tenants/{tenant}/suspend` | Suspend |
| POST | `/api/v1/super-admin/tenants/{tenant}/resume` | Resume |
| POST | `/api/v1/super-admin/tenants/{tenant}/impersonate` | Impersonate (for support) |

### 12.5 Audit logs
| Method | Path |
|---|---|
| GET | `/api/v1/super-admin/audit-logs/actions` |
| GET | `/api/v1/super-admin/audit-logs` |

### 12.6 Billing
| Method | Path |
|---|---|
| GET | `/api/v1/super-admin/billing/subscriptions` |
| GET | `/api/v1/super-admin/billing/mrr-breakdown` |

### 12.7 Team management
| Method | Path |
|---|---|
| GET | `/api/v1/super-admin/admins` |
| POST | `/api/v1/super-admin/admins/invite` |
| GET | `/api/v1/super-admin/admins/invitations` |
| DELETE | `/api/v1/super-admin/admins/{user}` |

### 12.8 Settings
| Method | Path |
|---|---|
| GET | `/api/v1/super-admin/settings` |
| PATCH | `/api/v1/super-admin/settings` |

---

## 🏢 13. RESTAURANT-OWNER ADMIN (`tenant.admin` middleware)

### 13.1 Brand management (Phase 2)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/brand` | Brand sozlamalari |
| PATCH | `/api/v1/admin/brand` | Update |
| POST | `/api/v1/admin/brand/logo` | Logo upload |
| POST | `/api/v1/admin/brand/cover` | Cover upload |
| POST | `/api/v1/admin/brand/hero` | Hero upload |
| POST | `/api/v1/admin/brand/favicon` | Favicon upload |

### 13.2 Custom domain management (Phase 2)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/domains` | List |
| POST | `/api/v1/admin/domains` | Add domain |
| GET | `/api/v1/admin/domains/{domain}` | Show |
| POST | `/api/v1/admin/domains/{domain}/verify` | DNS verify |
| POST | `/api/v1/admin/domains/{domain}/set-primary` | Set primary |
| DELETE | `/api/v1/admin/domains/{domain}` | Delete |

### 13.3 Tier features
| Method | Path |
|---|---|
| GET | `/api/v1/admin/tier-features` |

### 13.4 Native apps (Phase 3 — Enterprise tier)
| Method | Path | Throttle | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/apps` | — | List |
| POST | `/api/v1/admin/apps` | 30/min | Create app |
| GET | `/api/v1/admin/apps/{app}` | — | Show |
| PATCH | `/api/v1/admin/apps/{app}` | — | Update |
| DELETE | `/api/v1/admin/apps/{app}` | — | Delete |
| POST | `/api/v1/admin/apps/{app}/build` | **10/min** | Trigger EAS Build |
| GET | `/api/v1/admin/apps/{app}/builds` | — | List builds |
| POST | `/api/v1/admin/apps/{app}/builds/{buildId}/cancel` | — | Cancel |

### 13.5 Store submission (Phase 3 — D3)
| Method | Path | Throttle |
|---|---|---|
| POST | `/api/v1/admin/apps/{app}/builds/{buildId}/submit` | 10/min |
| GET | `/api/v1/admin/apps/{app}/builds/{buildId}/qr` | — |

### 13.6 AI Studio (Phase 4 — Pro+ tier)
| Method | Path | Throttle | AI tokens |
|---|---|---|---|
| POST | `/api/v1/admin/ai/menu/generate` | 30/min | ~5k |
| POST | `/api/v1/admin/ai/translate` | 60/min | ~1k per item |
| POST | `/api/v1/admin/ai/description` | 60/min | ~500 |
| GET | `/api/v1/admin/ai/usage` | — | — |

### 13.7 Demand forecasting (Phase 4 — E3)
| Method | Path | Throttle | AI? |
|---|---|---|---|
| GET | `/api/v1/admin/ai/forecast/top-items` | 120/min | ❌ Pure SQL |
| GET | `/api/v1/admin/ai/forecast/predict-week` | 60/min | ❌ Pure SQL |
| GET | `/api/v1/admin/ai/forecast/low-sellers` | 120/min | ❌ Pure SQL |
| POST | `/api/v1/admin/ai/insights` | 10/min | ✅ ~2.3k tokens (Enterprise) |

---

## 🍳 14. STAFF MOBILE (PIN auth + `staff.scope` middleware)

### 14.1 Profile
| Method | Path |
|---|---|
| GET | `/api/v1/staff/me` |

### 14.2 Clock in/out
| Method | Path |
|---|---|
| POST | `/api/v1/staff/clock-in` |
| POST | `/api/v1/staff/clock-out` |

### 14.3 Shifts
| Method | Path |
|---|---|
| GET | `/api/v1/staff/shifts/current` |
| GET | `/api/v1/staff/shifts` |

### 14.4 Breaks
| Method | Path |
|---|---|
| POST | `/api/v1/staff/breaks/start` |
| POST | `/api/v1/staff/breaks/end` |

### 14.5 Orders (Waiter)
| Method | Path |
|---|---|
| GET | `/api/v1/staff/orders/my` |
| POST | `/api/v1/staff/orders` |
| PATCH | `/api/v1/staff/orders/{order}/status` |

### 14.6 Kitchen (Cook)
| Method | Path |
|---|---|
| GET | `/api/v1/staff/kitchen/queue` |
| PATCH | `/api/v1/staff/orders/{order}/items/{item}/status` |

### 14.7 Stats
| Method | Path |
|---|---|
| GET | `/api/v1/staff/stats` |

### 14.8 Courier sub-API
| Method | Path | Throttle | Notes |
|---|---|---|---|
| GET | `/api/v1/staff/courier/available` | — | Available orders |
| GET | `/api/v1/staff/courier/active` | — | Current delivery |
| GET | `/api/v1/staff/courier/history` | — | Past deliveries |
| GET | `/api/v1/staff/courier/earnings` | — | Earnings + chart |
| POST | `/api/v1/staff/courier/orders/{order}/accept` | — | Accept delivery |
| POST | `/api/v1/staff/courier/orders/{order}/pickup` | — | Pickup |
| POST | `/api/v1/staff/courier/orders/{order}/deliver` | — | Deliver |
| POST | `/api/v1/staff/courier/orders/{order}/cancel` | — | Cancel |
| POST | `/api/v1/staff/courier/location` | **120/min** | GPS update (~0.5s interval) |

---

## 🛡️ 15. INTERNAL (Caddy reverse proxy)

| Method | Path | Throttle | Notes |
|---|---|---|---|
| GET | `/internal/caddy/verify` | 600/min | TLS on-demand "ask" endpoint |

> **Middleware:** `internal.caddy` — shared-secret header `X-Caddy-Token` yoki loopback origin.

---

## 🎯 MIDDLEWARE STACK

| Middleware | Maqsad | Source |
|---|---|---|
| `auth:sanctum` | Bearer token auth | Sanctum |
| `super-admin` | `users.is_super_admin = true` | `EnsureSuperAdmin.php` |
| `tenant.admin` | Owner/Manager + non-null tenant_id | `EnsureTenantAdmin.php` |
| `staff.scope` | Active staff (cashier/waiter/chef/courier) | `EnsureActiveStaff.php` |
| `kiosk.device` | KioskDevice token | `EnsureKioskDevice.php` |
| `internal.caddy` | Caddy shared-secret yoki loopback | `InternalCaddyOnly.php` |
| `payment.webhook.ips:click` | Click IP allowlist | `PaymentWebhookIpAllowlist.php` |
| `payment.webhook.ips:payme` | Payme IP allowlist | `PaymentWebhookIpAllowlist.php` |
| `tenant.resolve` | Custom domain → tenant binding | `ResolveTenantFromDomain.php` |
| `tenant.context` | RLS PostgreSQL session var | `SetTenantContext.php` |

---

## 🔑 RATE LIMITING JADVALI

| Endpoint kategoriya | Limit |
|---|---|
| Public read (marketplace, menu) | 60/min |
| Public write (guest order) | **5/min** ⚠️ |
| Public chat (AI) | **30/hour** ⚠️ |
| Webhooks | 60-120/min |
| Auth login | 10-30/min |
| Kiosk pair | 10/15min |
| Admin AI | 30-60/min + daily quota |
| Admin AI insights (Enterprise) | **10/min** |
| Admin app build | 10/min |
| Courier location | 120/min (every 0.5s) |
| Caddy verify (internal) | 600/min |
| Reverb auth | 120/min |

---

## 📡 RESPONSE FORMAT (CLAUDE.md §9)

```json
{
  "data": { /* resource or array */ },
  "meta": { "page": 1, "per_page": 20, "total": 142 },
  "errors": null
}
```

**Pagination:** Cursor-based (feeds) + Offset-based (admin tables)
**Versioning:** Never break v1 — introduce v2 endpoint instead

---

> Yangilangan: 2026-05-03 · Manba: `apps/api/routes/api.php` (594 qator).
