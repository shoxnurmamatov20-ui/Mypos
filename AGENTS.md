# Agent Capabilities

Claude Code subagents registered for this project. Invoke via the `Agent` tool with `subagent_type`.

## Available Agents

### `laravel-backend-dev`
**Scope:** Laravel module development in `apps/api/app/Domain/`.
**Capabilities:** Create migrations, Eloquent models, Actions, DTOs, Controllers, FormRequests, API Resources, Policies, Events, Jobs, Pest tests.
**Knows:** DDD structure, Spatie stack, Filament integration.

### `filament-resource-dev`
**Scope:** Filament v3 admin panel CRUD in `apps/api/app/Filament/`.
**Capabilities:** Resources, Pages, Widgets, Relations, Filters, Actions, Forms, Tables.
**Knows:** Filament 3 API, Tenancy config.

### `nextjs-page-dev`
**Scope:** Next.js 15 App Router pages/layouts in `apps/web-*/`.
**Capabilities:** Server Components, Client Components, Server Actions, route handlers, metadata.
**Knows:** React 19, Tailwind 4, @mypos/ui components, next-intl.

### `expo-screen-dev`
**Scope:** Expo Router screens in `apps/mobile-*`, `apps/pos-terminal`, `apps/kiosk`.
**Capabilities:** Route file, screen component, hooks, styles (NativeWind), navigation.
**Knows:** Expo SDK 54, RN 0.81, Reanimated 4, i18next.

### `db-migration-author`
**Scope:** PostgreSQL migrations in `apps/api/database/migrations/`.
**Capabilities:** Create tables, indexes, foreign keys, RLS policies, seed data.
**Knows:** PostgreSQL 17 features, multi-tenancy pattern.

### `i18n-translator`
**Scope:** Translation files across backend + web + mobile.
**Capabilities:** Add keys to `lang/uz/`, `lang/ru/`, `lang/en/` + Next.js messages + Expo i18n.
**Knows:** ICU format, UZ grammar (lotin + kirill), RU grammar.

### `test-writer`
**Scope:** Tests — Pest (backend), Vitest (unit), Playwright (web E2E), Maestro (mobile E2E).
**Capabilities:** Feature tests, unit tests, E2E flows, fixtures, factories.
**Knows:** Coverage targets (80%), common gotchas.

### `security-auditor`
**Scope:** Security review of PRs and modules.
**Capabilities:** OWASP Top 10, SQL injection, auth bypass, CSRF, XSS, secret leaks, RBAC gaps.
**Use proactively before merging any auth/payment/tenant-isolation change.**

### `performance-auditor`
**Scope:** Performance review — N+1, missing indexes, large bundles, slow queries.
**Capabilities:** EXPLAIN ANALYZE, bundle analysis, Lighthouse review, profiling guidance.

### `api-contract-keeper`
**Scope:** Keeping OpenAPI → TS SDK in sync.
**Capabilities:** Scribe config, openapi-typescript, SDK regeneration, breaking change detection.

---

## Custom Slash Commands

See `.claude/commands/` for each:
- `/add-module <name>`
- `/add-endpoint <domain>.<action>`
- `/add-translation <key>`
- `/sync-api`
- `/migrate`
- `/deploy-preview`

---

## Invocation Examples

```
# Create a new backend module
> Use laravel-backend-dev to create the Reservations domain with basic CRUD

# Generate Filament admin for a model
> Use filament-resource-dev to create TenantResource with relations to Users and Subscriptions

# i18n work
> Use i18n-translator to add keys for the menu module: menu.item.{created,updated,deleted}

# Security review
> Use security-auditor to review the payment webhook handler in apps/api/app/Http/Controllers/Api/V1/Webhook/ClickController.php
```
