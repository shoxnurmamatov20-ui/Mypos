# CLAUDE.md — Agent Instructions

> This file is **required reading** for every Claude Code session in this repo. It defines how we work.

## Project

**MyPOS** — Markaziy Osiyo uchun Restaurant Operating System (SaaS).
- Backend: **Laravel 12 + PHP 8.5**
- Web: **Next.js 15 + React 19 + TypeScript 5.9**
- DB: **MySQL 8.4** (XAMPP local) | Cache/Queue: **Redis 7.4** | Search: **Meilisearch** | Storage: **MinIO**
- Real-time: **Laravel Reverb**
- Admin: **Filament 3** (CRUD) + **Next.js** (workflows)
- Hosting: **UZCLOUD** (UZ) + **Beeline DC** (DR)
- Orchestration: **Coolify**

See `MYPOS_ULTRA_PLAN.md` on Desktop for the complete vision.

## Monorepo

- **Turborepo + pnpm workspaces**
- `apps/` — runnable applications (9 Next.js web apps + telegram-bot + Laravel backend)
- `packages/` — shared TypeScript libraries (10)
- `infra/` — Docker, Coolify, deploy scripts
- `docs/` — architecture, API, ADRs, runbooks
- `.claude/agents/` — specialized subagents (use via Agent tool)
- `_legacy-2026-04/` — old MVP, read-only reference

## Golden Rules

### 1. File size
- ≤ 400 lines per file. Split otherwise.
- ≤ 50 lines per function.
- ≤ 200 lines per React component.

### 2. Type safety
- **TypeScript:** strict, `noUncheckedIndexedAccess`, never `any`.
- **Laravel:** typed properties, DTOs (spatie/laravel-data), FormRequest validation, Enums for constants.
- **Shared types:** `packages/types/` + Zod schemas in `packages/validation/`.

### 3. Validation
- Backend: Laravel `FormRequest` — every input validated.
- Frontend: `react-hook-form` + Zod (same schema as backend where possible).
- Never trust client input.

### 4. Multi-tenancy
- Every tenant-scoped table has `tenant_id`.
- Eloquent Global Scope (`BelongsToTenant` trait) filters automatically — **sole** tenant guard since 2026-05-10 MySQL revert.
- ~~PostgreSQL RLS~~ — REMOVED (ADR-0005). App-layer is now the only enforcement layer.
- Never call `withoutGlobalScopes()` outside `SuperAdminScope::unguard()` audit context — single bug = cross-tenant leak.
- Never query across tenants except in super admin context.

### 5. i18n (UZ/RU/EN)
- Translation keys: `domain.section.key` (e.g., `menu.item.created`).
- Laravel: `lang/{uz,ru,en}/...php`.
- Next.js: `messages/{uz,ru,en}.json` (next-intl).
- **Never hardcode user-facing strings.**

### 6. Testing
- Backend: **Pest** — min 80% coverage.
- Web: **Vitest** (unit) + **Playwright** (E2E).
- Every feature PR includes tests.

### 7. Security
- Never log passwords/tokens/PINs.
- Use `Crypt::` (Laravel) for PII fields.
- Rate limit on auth + write endpoints.
- Signed URLs for sensitive files.
- `.env.example` committed, `.env` never.
- Secrets via Doppler/Coolify (prod), `.env.local` (dev).

### 8. Database
- Migrations: descriptive names, foreign keys, indexes on FK + lookup columns.
- No raw SQL except in Repository layer (migrations OK).
- Prevent N+1 via eager loading (`with()`).
- Every tenant-scoped table: `tenant_id`, RLS policy.
- Timestamps: `created_at`, `updated_at`, soft delete: `deleted_at`.

### 9. API design
- REST `/api/v1/*` versioned.
- Response envelope: `{ data, meta, errors }`.
- Pagination: cursor-based for feeds, offset for admin tables.
- Scribe docs (`php artisan scribe:generate`) → OpenAPI → TS SDK auto-regen.
- Never break v1 contract — add v2 endpoint instead.

### 10. Commits & PRs
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Scope: `feat(orders): add split check`.
- PR template: summary + test plan + screenshots.
- Squash merge; PR title becomes commit message.

### 11. Design system — APPLE-ONLY (LOCKED 2026-05-03)
- **Source of truth**: `packages/design-tokens/DESIGN-apple.md` — the ONLY design reference.
- **Tokens**: `packages/design-tokens/src/` — Apple-based (`@mypos/design-tokens`).
- **Brand voltage**: MyPOS Coral `#EA7C69` — single accent, used scarcely (Apple's "single action color" rule).
- **No hybrids** — no Notion, no Linear, no Stripe, no Vercel, no Cursor, no Figma, no Airbnb, no Claude. Apple-only.
- **Discipline rules** (12):
  1. Pill primary CTAs (`rounded-pill` 9999px) — never `rounded-md` on primary.
  2. Body 17px (`text-body`) — NOT 16px.
  3. Weight 500 absent — only 300/400/600 (`font-light/regular/semibold`).
  4. Single drop-shadow on product imagery only (`shadow-product`) — never on cards/buttons/text.
  5. Press transform `active:scale-95` universal.
  6. Edge-to-edge tiles, alternating canvas/parchment/dark with 80px section.
  7. Tabular numerals on every price/count/time (`font-feature-settings: "tnum"`).
  8. Warm near-black ink `#1d1d1f` — never pure black.
  9. Frosted-glass sub-nav (backdrop-blur + saturate).
  10. Italic emphasis within headlines (`<em>`) for Apple voice operative word.
  11. Cyrillic display tracking reduced 20% (`adjustTrackingForCyrillic()`).
  12. SF Pro Display (≥19px) + SF Pro Text (<19px) + SF Mono (numerals/code) — never slab-serif.
- **Per-tenant**: white-label via `var(--tenant-primary)` CSS variable — never hardcode hex.
- **All other DESIGN-*.md files deleted** on 2026-05-03 — do not recreate.

## Domain Structure (Laravel backend)

```
apps/api/app/Domain/<Domain>/
├── Models/              — Eloquent models
├── Actions/             — Single-action classes (one per verb)
├── DataTransferObjects/ — Typed DTOs (spatie/laravel-data)
├── Enums/
├── Events/
├── Listeners/
├── Policies/
├── Rules/
├── Exceptions/
└── Services/            — Multi-step orchestration
```

`app/Http/Controllers/Api/V1/<Domain>/` — thin, delegate to Actions/Services.

## Feature workflow

1. **Design** — update `docs/adr/` if architecture change.
2. **Types** — `packages/types/` + `packages/validation/` (Zod).
3. **Backend** — migration + Model + Action + Controller + Request + Resource + Policy + Test.
4. **API client** — `pnpm sync:api` regenerates SDK.
5. **Frontend** — page/screen using generated SDK, form with Zod.
6. **i18n** — add keys to all 3 languages.
7. **Test** — backend Pest + frontend Vitest/Playwright.
8. **PR** — green CI required.

## Subagents

Use via the Agent tool with `subagent_type`:
- `laravel-backend-dev` — Laravel modul yozish
- `filament-resource-dev` — Filament resource yaratish
- `nextjs-page-dev` — Next.js page
- `db-migration-author` — migration
- `i18n-translator` — UZ/RU/EN keys
- `test-writer` — tests
- `security-auditor` — security review

See `.claude/agents/*.md` for each agent's scope.

## Custom slash commands

- `/add-module <name>` — yangi backend domain
- `/add-endpoint <domain>.<action>` — API endpoint
- `/add-translation <key>` — UZ/RU/EN keys
- `/sync-api` — regenerate TS SDK from Laravel OpenAPI

## Forbidden patterns

- ❌ `env()` outside config files (use `config()`)
- ❌ Raw SQL in controllers (use Eloquent/Repository)
- ❌ `any` in TypeScript
- ❌ Inline user-facing strings (use i18n)
- ❌ Committed secrets
- ❌ Skipping tests to merge
- ❌ Cross-tenant queries without explicit `SuperAdminScope`
- ❌ Mixing design systems (Notion / Linear / Stripe / Vercel / Cursor / Figma / Airbnb / Claude) — **Apple-only**
- ❌ `font-medium` / weight 500 (Apple skips this weight)
- ❌ `rounded-md` on primary CTAs (Apple uses `rounded-pill`)
- ❌ `shadow-md` / `shadow-lg` on cards (Apple uses `shadow-product` on imagery only)
- ❌ 16px body on consumer surfaces (Apple body is 17px)
- ❌ Hardcoded hex colors in components (use Tailwind tokens / `var(--tenant-primary)`)
- ❌ Slab-serif fonts (Apple uses SF Pro Display sans)
- ❌ Pure black text `#000` (Apple ink is warm `#1d1d1f`)

## Working on legacy code

`_legacy-2026-04/` is read-only reference. Don't modify. Extract data/logic only.

---

**When in doubt:** prefer clarity over cleverness, safety over speed, tests over trust.
