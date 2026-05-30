# @mypos/web-cashier

Dedicated **cashier panel** for MyPOS — a deliberately compact, cashier-only
surface. Same visual language as `web-superadmin` (light/dark, teal accent,
sidebar + sticky topbar), but stripped down to the four things a cashier
actually touches.

- **Port:** `3008` (dev)
- **Stack:** Next.js 15 · React 19 · next-intl · TanStack Query · Tailwind v4
- **Self-contained:** no `@mypos/*` workspace deps — own API client, UI
  primitives and i18n, so it builds in isolation.

## Sections (and nothing more)

| Route        | Screen     | What it does                                            |
|--------------|------------|---------------------------------------------------------|
| `/{l}/pos`   | Kassa      | Searchable menu grid + live order cart + charge         |
| `/{l}/orders`| Buyurtmalar| Active/completed orders, one-tap status advancement     |
| `/{l}/payments` | To'lovlar | Shift payment list + cash/card/total summary         |
| `/{l}/shift` | Smena      | Clock in/out, breaks, today's stats, recent shifts      |

`/{l}` is the locale: `uz` (default) · `ru` · `en` · `kz`.

## Auth

No login form of its own. The universal portal (`web-portal`, :3005)
authenticates, then the backend `config/auth_redirects.php` sends the
`cashier` role to `http://localhost:3008/uz/pos` with the Sanctum bearer
token in the URL fragment (`#token=…&role=cashier`). `AuthGate` reads it
once, persists it, and strips the fragment.

## Offline-first dev

Every data hook tries the Laravel API and falls back to `src/lib/mock-data.ts`
fixtures when it's unreachable — the panel is fully demonstrable before the
backend is seeded.

## Scripts

```bash
pnpm --filter @mypos/web-cashier dev        # http://localhost:3008
pnpm --filter @mypos/web-cashier build
pnpm --filter @mypos/web-cashier typecheck
```
