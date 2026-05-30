# @mypos/web-superadmin

Super-admin (SaaS owner) dashboard for MyPOS — manages tenants, billing, audit logs, and platform-wide settings.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5.9
- next-intl (UZ / RU / EN — RU + EN primary)
- Tailwind CSS 4 (via `@mypos/design-tokens`) — **dark theme by default**
- Zustand (auth)
- TanStack Query (server cache)
- Recharts (KPI charts)
- date-fns (date helpers)
- `@mypos/api-client` (Laravel SDK)

## Audience & UX

- Internal SaaS operators (owner / admin / support / finance / developer roles).
- Desktop-first, dense information UI: tables, charts, detail panels.
- Sidebar navigation (collapsible) + topbar (breadcrumbs, language switcher, user menu).
- Strict gate: only `is_super_admin = true` users can sign in.

## Develop

```bash
pnpm install --filter=@mypos/web-superadmin
pnpm --filter=@mypos/web-superadmin dev   # http://localhost:3003
pnpm --filter=@mypos/web-superadmin typecheck
```

### Demo credentials (dev fallback)

If the backend is unreachable, the auth store accepts:

```
admin@mypos.uz / superpass123
```

This sets a mock super-admin session locally so the foundation is usable
before the `/api/v1/super-admin/*` endpoints land.

## Layout

- `src/app/[locale]` — App Router pages (locale-prefixed).
  - `(authenticated)/` — sidebar + topbar layout (gated by `ProtectedRoute`).
  - `login/` — public login page.
- `src/components/layout` — sidebar, topbar, user menu, language switcher.
- `src/components/auth` — AuthGate, ProtectedRoute.
- `src/stores` — Zustand stores (`auth`).
- `src/lib` — API client, helpers, formatters.
- `src/data` — mock fixtures (until backend ready).
- `messages/{uz,ru,en}.json` — i18n strings.

## Phase 1 — foundation only

This package currently ships the **foundation**: config, i18n routing, dark
root layout, providers, auth store + gate, sidebar/topbar, login page,
mock tenant + dashboard data. Feature pages (dashboard, tenants, billing,
audit, admins, settings) are added by their respective agents.
