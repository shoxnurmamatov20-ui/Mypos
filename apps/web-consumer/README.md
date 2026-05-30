# @mypos/web-consumer

Consumer-facing web app for MyPOS — restaurant discovery, ordering and tracking (similar to Uber Eats / Grab on the web).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5.9
- next-intl (UZ / RU / EN)
- Tailwind CSS 4 (via `@mypos/design-tokens`)
- Zustand (auth + cart)
- TanStack Query (server cache)
- `@mypos/api-client` (Laravel SDK)

## Develop

```bash
pnpm install --filter=@mypos/web-consumer
pnpm --filter=@mypos/web-consumer dev   # http://localhost:3002
pnpm --filter=@mypos/web-consumer typecheck
```

## Layout

- `src/app/[locale]` — App Router pages (locale-prefixed).
- `src/components` — UI components.
- `src/stores` — Zustand stores (`auth`, `cart`).
- `src/lib` — API client, helpers.
- `src/data` — mock fixtures (will be replaced by API once endpoints land).
- `messages/{uz,ru,en}.json` — i18n strings.

## Phase 1 — foundation only

This package currently ships the **foundation** (config, layout, providers,
auth/cart stores, header, mock data). Feature pages (home, restaurants,
cart, checkout, orders, profile) land in Phase 2.
