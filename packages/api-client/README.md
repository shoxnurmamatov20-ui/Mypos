# @mypos/api-client

TypeScript SDK for MyPOS API — used by web apps, mobile apps, and the Telegram bot.

## Current state

Manual thin wrapper with:
- Typed HTTP verbs (`get`, `post`, `put`, `patch`, `delete`)
- Bearer token auth via `getAuthToken` config
- `401 → onUnauthorized` hook for logout-on-expiry flows
- `ApiError` with status + body

## Future (auto-generated)

Once Laravel + Scribe publishes `docs/api/openapi.yml`:

1. `pnpm generate` runs `openapi-typescript` → `src/generated/`
2. Typed domain APIs: `menu.list()`, `orders.create()`, etc.
3. Zero manual maintenance as backend evolves

## Usage

```ts
import { MyPosApiClient, healthApi } from '@mypos/api-client';

const api = new MyPosApiClient({
  baseUrl: 'http://localhost:8000',
  getAuthToken: () => localStorage.getItem('token'),
  onUnauthorized: () => redirect('/login'),
});

const health = await healthApi.check(api);
```
