# 📦 DEPENDENCIES — TO'LIQ DEPS REPORT

> Manba: 1 root + 14 apps + 8 packages package.json + 1 composer.json
> Package manager: **pnpm 10.28.2** (workspaces)
> Build: **Turborepo 2.3.0** (TUI)
> Lint: **Biome 2.2.0** (no ESLint)
> Type: **TypeScript 5.9.2** (strict)

---

## 🌳 ROOT KONFIGURATSIYA

**File:** `package.json`

```json
{
  "name": "mypos",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10.28.2",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=10.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.2.0",
    "turbo": "^2.3.0",
    "typescript": "^5.9.2",
    "husky": "^9.1.7"
  }
}
```

**Scripts:**
- `dev` — turbo run dev
- `build` — turbo run build
- `lint` — biome check .
- `lint:fix` — biome check --write .
- `format` — biome format --write .
- `typecheck` — turbo run typecheck
- `test` — turbo run test
- `test:e2e` — turbo run test:e2e
- `clean` — turbo run clean && rm -rf node_modules
- `docker:up/down/logs` — infra/docker-compose.yml
- `prepare` — husky || true

---

## 🐘 BACKEND — Laravel API (`apps/api/composer.json`)

### PHP version
- **PHP: ^8.2** (real: 8.5.1 — see `.tool-versions`)

### Production dependencies (17 ta)

| Paket | Versiya | Maqsad |
|---|---|---|
| `laravel/framework` | ^12.0 | Asosiy framework |
| `laravel/horizon` | ^5.45 | Queue Horizon UI |
| `laravel/reverb` | ^1.10 | WebSocket server (Pusher protocol) |
| `laravel/sanctum` | ^4.3 | API token authentication |
| `laravel/scout` | ^11.1 | Full-text search (Meilisearch) |
| `laravel/tinker` | ^2.10.1 | REPL |
| `filament/filament` | ^3.3 | Admin panel UI |
| `spatie/laravel-activitylog` | ^5.0 | Audit logging |
| `spatie/laravel-data` | ^4.22 | DTO/Data mapping |
| `spatie/laravel-medialibrary` | ^11.21 | Media handling (MinIO) |
| `spatie/laravel-multitenancy` | ^4.1 | Multi-tenant support |
| `spatie/laravel-permission` | ^7.3 | RBAC (roles + permissions) |
| `spatie/laravel-query-builder` | ^7.2 | Filterable queries |
| `spatie/laravel-translatable` | ^6.13 | Translatable models |
| `doctrine/dbal` | ^4.4 | DB abstraction |
| `predis/predis` | ^3.4 | Redis client |

### Dev dependencies (10 ta)

| Paket | Versiya | Maqsad |
|---|---|---|
| `pestphp/pest` | ^3.8 | Test framework |
| `pestphp/pest-plugin-laravel` | ^3.2 | Laravel Pest |
| `phpunit/phpunit` | ^11.5.50 | Underlying unit |
| `larastan/larastan` | ^3.9 | Static analysis (level 8) |
| `laravel/pint` | ^1.24 | Code style |
| `laravel/pail` | ^1.2.2 | Log monitoring |
| `laravel/sail` | ^1.41 | Docker dev env |
| `mockery/mockery` | ^1.6 | Mocking |
| `fakerphp/faker` | ^1.23 | Fake data |
| `nunomaduro/collision` | ^8.6 | Error handling |

### Composer scripts
- `setup` — install + .env + key:gen + migrate + npm
- `dev` — `php artisan serve` + `queue:listen` + `pail` + `npm run dev` (concurrently)
- `test` — `php artisan config:clear && pest`
- `post-autoload-dump` — `package:discover` + `filament:upgrade`

### Vite frontend (`apps/api/package.json`)
**Filament admin uchun:**
- `@tailwindcss/vite`: ^4.0.0
- `laravel-vite-plugin`: ^2.0.0
- `tailwindcss`: ^4.0.0
- `vite`: ^7.0.7
- `concurrently`: ^9.0.1
- `axios`: ^1.11.0

---

## 🌐 WEB APPS (Next.js 15)

### Umumiy Web stack
| Paket | Versiya | Foydalanuvchilar |
|---|---|---|
| `next` | ^15.1.0 | hammasi |
| `react` | ^19.0.0 | hammasi |
| `react-dom` | ^19.0.0 | hammasi |
| `tailwindcss` | ^4.0.0 | hammasi |
| `@tailwindcss/postcss` | ^4.0.0 | hammasi |
| `postcss` | ^8.4.0 | hammasi |
| `typescript` | ^5.9.2 | hammasi |
| `@types/node` | ^22.0.0 | hammasi |
| `@types/react` | ^19.0.0 | hammasi |
| `@types/react-dom` | ^19.0.0 | hammasi |

### Web common runtime deps
| Paket | Versiya | Maqsad |
|---|---|---|
| `clsx` | ^2.1.0 | className utility |
| `tailwind-merge` | ^2.5.0 | Tailwind merge |
| `lucide-react` | ^0.468.0 | Ikonlar |
| `zod` | ^3.24.0 | Schema validation |
| `zustand` | ^5.0.0 | State management |
| `@tanstack/react-query` | ^5.62.0 | Server state |
| `@hookform/resolvers` | ^3.9.0 | Form validation |
| `react-hook-form` | ^7.54.0 | Forms |
| `next-intl` | ^3.26.0 | i18n |
| `@mypos/api-client` | workspace:* | API SDK |
| `@mypos/design-tokens` | workspace:* | Tokens |
| `@mypos/ui` | workspace:* | UI components |
| `@mypos/utils` | workspace:* | Utils |

---

### `apps/web-dashboard` (Manager Dashboard)
**Port:** 3001

**Unique deps:**
- `@mypos/validation`: workspace:*
- `recharts`: ^2.15.0 — chartlar
- `sonner`: ^1.7.0 — toast notifs

**Scripts:** `dev/build/start --port 3001`

---

### `apps/web-consumer` (Marketplace)
**Port:** 3002

**Unique deps:**
- `framer-motion`: ^11.15.0 — animatsiyalar

---

### `apps/web-superadmin` (MyPOS Ops)
**Port:** 3003

**Unique deps:**
- `date-fns`: ^4.1.0 — sana manipulatsiya
- `recharts`: ^2.15.0 — chartlar
- `framer-motion`: ^11.15.0

---

### `apps/web-qr` (QR Menu PWA)
**Port:** 3005

**Notes:** Eng minimal stack — validation/charting yo'q

---

### `apps/kds` (Kitchen Display System)
**Port:** 3006

**Notes:** Standard web stack, qo'shimcha deps yo'q

---

### `apps/web-marketing` (mypos.uz)
**Port:** 3007

**Unique deps:**
- `@phosphor-icons/react`: ^2.1.10 — alternative ikonlar
- `@mypos/validation`: workspace:*
- `framer-motion`: ^11.15.0

**Dev deps:**
- `vitest`: ^2.1.0 — unit tests
- `@vitest/coverage-v8`: ^2.1.0
- `cross-env`: ^7.0.3

**Scripts (cross-env):**
- `dev`: `cross-env NODE_ENV=development next dev --port 3007`
- `build`: `cross-env NODE_ENV=production next build`
- `test`: `vitest run`
- `test:watch`: `vitest`

---

## 📱 MOBILE APPS (Expo SDK 54)

### Umumiy Mobile stack
| Paket | Versiya | Notes |
|---|---|---|
| `expo` | ~54.0.0 | Asosiy framework |
| `react-native` | 0.81.4 | RN |
| `react` | 19.1.0 | ⚠️ Web'dan farqli (19.0.0) |
| `react-dom` | 19.1.0 | |
| `expo-router` | ~6.0.0 | File-based routing |
| `nativewind` | ^4.1.0 | Tailwind for RN |
| `tailwindcss` | ^3.4.0 | ⚠️ Web 4.0.0'dan farqli |
| `react-native-web` | ^0.21.2 | Web support |
| `i18next` | ^24.0.0 | i18n engine |
| `react-i18next` | ^15.1.0 | React binding |

### Expo modules (Mobile umumiy)
- `@expo/metro-runtime` ~6.1.2
- `expo-constants` ~18.0.0
- `expo-font` ~14.0.0
- `expo-image` ~3.0.0
- `expo-linking` ~8.0.0
- `expo-localization` ~17.0.0
- `expo-secure-store` ~15.0.0 — SecureStorage
- `expo-status-bar` ~3.0.0
- `react-native-gesture-handler` ~2.28.0
- `react-native-reanimated` ~4.1.0 — animatsiya engine
- `react-native-safe-area-context` ~5.6.0
- `react-native-screens` ~4.16.0
- `whatwg-fetch` ^3.6.20 — polyfill

---

### `apps/mobile-consumer` (B2C App)

**Unique deps:**
- `expo-location` ~19.0.0 — GPS
- `laravel-echo` ^1.16.1 — WebSocket client
- `pusher-js` ^8.4.0 — Reverb client
- `react-native-toast-message` ^2.2.1 — Toast UI

---

### `apps/mobile-consumer-template` (Per-tenant template)

**Identical to mobile-consumer**

**Build scripts (EAS):**
- `build:ios`: `eas build --platform ios --profile production --non-interactive`
- `build:android`: `eas build --platform android --profile production`
- `submit:ios/android`: `eas submit --platform ...`
- `prebuild`: `bash ./prebuild.sh`

---

### `apps/mobile-courier` (Kuryer)
- Standard mobile stack
- ❌ Location, WebSocket — NO (custom hooks)

---

### `apps/mobile-staff` (Waiter + Cook)
- Standard mobile stack
- ❌ Location, WebSocket — NO

---

### `apps/pos-terminal` (Tablet POS)
- Standard mobile stack
- ❌ Location, WebSocket — NO

---

### `apps/kiosk` (Self-service)
- Standard mobile stack

---

## 🤖 TELEGRAM BOT (`apps/telegram-bot`)

**Type:** Node.js TypeScript ESM

**Production deps:**
- `telegraf`: ^4.16.0 — Bot framework
- `zod`: ^3.24.0 — Validation
- `dotenv`: ^16.4.5 — Env config
- `@mypos/api-client`: workspace:*
- `@mypos/utils`: workspace:*

**Dev deps:**
- `@types/node`: ^22.0.0
- `typescript`: ^5.9.2
- `tsx`: ^4.19.0 — TS runner

**Scripts:**
- `dev`: `tsx watch src/index.ts`
- `start`: `node dist/index.js`
- `build`: `tsc -p tsconfig.json`

---

## 📦 SHARED PACKAGES (10 ta)

### `packages/api-client`
**Deps:** `@mypos/types`: workspace:*
**Subpath exports (16 ta):**
- `.`, `./auth`, `./client`, `./tables`, `./menu`, `./orders`, `./stats`, `./public`, `./customers`, `./employees`, `./payments`, `./inventory`, `./staff`, `./courier`, `./kiosk`, `./super-admin`

### `packages/types`
**No external deps**
**Subpath exports:** `.`, `./order`, `./menu`, `./table`, `./employee`, `./tenant`, `./customer`, `./common`

### `packages/ui`
**Deps:**
- `@mypos/design-tokens`: workspace:*
- `clsx`: ^2.1.0
- `tailwind-merge`: ^2.5.0

**Peer deps:**
- `react`: ^19.0.0 || ^18.0.0 (required)
- `react-native`: >=0.75.0 (optional)

### `packages/design-tokens`
**No external deps**
**Subpath exports (10 ta):**
- `.`, `./colors`, `./typography`, `./spacing`, `./radius`, `./shadows`, `./breakpoints`, `./motion`, `./tenant`, `./tailwind`

### `packages/utils`
**No external deps**
**Subpath exports:** `.`, `./currency`, `./date`, `./phone`, `./string`

### `packages/i18n`
**No external deps**
**Subpath exports:** `.`, `./uz`, `./ru`, `./en`, `./kz`

### `packages/validation`
**Deps:** `zod`: ^3.24.0

### `packages/config`
**No runtime deps**
**Subpath exports (configs):** `./typescript/base`, `./typescript/nextjs`, `./typescript/expo`, `./typescript/node`, `./biome`, `./tailwind`

### `packages/analytics` — STUB (empty)
### `packages/feature-flags` — STUB (empty)

---

## ⚠️ VERSIYA DRIFTS (E'TIBOR BERILSIN)

### React
- **Web:** `^19.0.0`
- **Mobile:** `19.1.0`
- 🔴 Patch version mismatch — recommend align to 19.1.0

### Tailwind CSS
- **Web:** `^4.0.0` (with `@tailwindcss/postcss` 4.0.0)
- **Mobile:** `^3.4.0` (NativeWind cheklovi)
- 🟡 Major version difference — Tailwind 4 has breaking API changes

### Node
- **Engine:** `>=22.0.0`
- LTS: April 2027
- 🟢 OK

---

## 🔄 INTERNAL WORKSPACE GRAPH

```
@mypos/types (root)
  ↑
@mypos/api-client → uses types
  ↑
ALL APPS (web + mobile + telegram-bot)

@mypos/design-tokens (root)
  ↑
@mypos/ui → uses design-tokens
  ↑
ALL WEB APPS (mobile uses NativeWind directly)

@mypos/utils → ALL APPS
@mypos/validation → web-dashboard, web-marketing
@mypos/i18n → packages-only (apps use next-intl/i18next directly)
@mypos/config → ALL APPS (TS configs)
```

---

## 📊 CRITICAL DEPS JADVALI

### Form management (universal)
- `react-hook-form`: ^7.54.0
- `@hookform/resolvers`: ^3.9.0
- `zod`: ^3.24.0

### Server state (universal)
- `@tanstack/react-query`: ^5.62.0

### Client state (most apps)
- `zustand`: ^5.0.0

### Animations
- `framer-motion`: ^11.15.0 (web-consumer, web-superadmin, web-marketing)
- `react-native-reanimated`: ~4.1.0 (mobile)

### Icons
- `lucide-react`: ^0.468.0 (web)
- `@phosphor-icons/react`: ^2.1.10 (web-marketing only)

### Real-time (Reverb client)
- `laravel-echo`: ^1.16.1 (mobile-consumer, mobile-consumer-template)
- `pusher-js`: ^8.4.0

### Charts
- `recharts`: ^2.15.0 (web-dashboard, web-superadmin)

### Toast/Notifications
- `sonner`: ^1.7.0 (web-dashboard)
- `react-native-toast-message`: ^2.2.1 (mobile-consumer)

### Date utilities
- `date-fns`: ^4.1.0 (web-superadmin)

---

## 🧪 TESTING STACK

| Layer | Tool | Versiya | Apps |
|---|---|---|---|
| **Backend** | Pest | ^3.8 | apps/api |
| **Backend (underlying)** | PHPUnit | ^11.5.50 | apps/api |
| **Web unit** | Vitest | ^2.1.0 | web-marketing (faqat — boshqalar configured emas) |
| **Coverage** | @vitest/coverage-v8 | ^2.1.0 | web-marketing |
| **Mobile unit** | Vitest | ✅ | mobile-consumer (`vitest.config.ts`) |
| **E2E (Web)** | Playwright | not yet configured | — |
| **E2E (Mobile)** | Maestro | not yet configured | — |

---

## 🛠️ BUILD & DEV TOOLING

| Layer | Tool |
|---|---|
| **Monorepo orchestration** | Turborepo 2.3.0 |
| **Package manager** | pnpm 10.28.2 (workspaces) |
| **Lint + Format** | Biome 2.2.0 (replaces ESLint + Prettier) |
| **Type check** | TypeScript 5.9.2 strict |
| **Git hooks** | Husky 9.1.7 |
| **Backend lint** | Laravel Pint 1.24 |
| **Backend static** | Larastan 3.9 (level 8) |
| **Backend test** | Pest 3.8 + PHPUnit 11.5 |
| **Frontend test** | Vitest 2.1 + @vitest/coverage-v8 |

---

## 📝 ENG MUHIM `engines` + `peerDependencies`

```json
// Root
"engines": { "node": ">=22.0.0", "pnpm": ">=10.0.0" }

// @mypos/ui peer
"peerDependencies": {
  "react": "^19.0.0 || ^18.0.0",
  "react-native": ">=0.75.0"  // optional
}
```

---

## ⚠️ MISSING/STUB

- `packages/analytics` — empty placeholder (kelajakda PostHog yoki Plausible)
- `packages/feature-flags` — empty placeholder (kelajakda GrowthBook)

---

> Yangilangan: 2026-05-03 · Manba: 1 root + 14 apps + 8 packages package.json + 1 composer.json
