# CLAUDE.md — Agent Instructions

> This file is **required reading** for every Claude Code session in this repo. It defines how we work.

## Project

**MyPOS** — Markaziy Osiyo uchun Restaurant Operating System (SaaS).
- Backend: **Laravel 12 + PHP 8.5**
- Web: **Next.js 15 + React 19 + TypeScript 5.9**
- Mobile: **Expo SDK 54 + React Native 0.81**
- DB: **PostgreSQL 17** | Cache/Queue: **Redis 7.4** | Search: **Meilisearch** | Storage: **MinIO**
- Real-time: **Laravel Reverb**
- Admin: **Filament 3** (CRUD) + **Next.js** (workflows)
- Hosting: **UZCLOUD** (UZ) + **Beeline DC** (DR)
- Orchestration: **Coolify**

See `MYPOS_ULTRA_PLAN.md` on Desktop for the complete vision.

## Monorepo

- **Turborepo + pnpm workspaces**
- `apps/` — runnable applications (12 + backend)
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
- Eloquent Global Scope filters automatically.
- PostgreSQL RLS enforced as defense-in-depth.
- Never query across tenants except in super admin context.

### 5. i18n (UZ/RU/EN)
- Translation keys: `domain.section.key` (e.g., `menu.item.created`).
- Laravel: `lang/{uz,ru,en}/...php`.
- Next.js: `messages/{uz,ru,en}.json` (next-intl).
- Expo: `i18n/{uz,ru,en}.json` (i18next).
- **Never hardcode user-facing strings.**

### 6. Testing
- Backend: **Pest** — min 80% coverage.
- Web: **Vitest** (unit) + **Playwright** (E2E).
- Mobile: **Vitest** (unit) + **Maestro** (flows).
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
- `expo-screen-dev` — Expo screen
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

## Working on legacy code

`_legacy-2026-04/` is read-only reference. Don't modify. Extract data/logic only.

---

**When in doubt:** prefer clarity over cleverness, safety over speed, tests over trust.
