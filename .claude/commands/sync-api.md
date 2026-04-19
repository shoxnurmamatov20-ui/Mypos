---
name: sync-api
description: Regenerate OpenAPI spec from Laravel and update TypeScript SDK used by web/mobile apps.
---

Synchronize API contract between Laravel backend and TypeScript clients.

## Steps

1. Run `cd apps/api && php artisan scribe:generate`
2. Verify `docs/api/openapi.yml` updated
3. Run `pnpm --filter @mypos/api-client generate`
4. Verify `packages/api-client/src/generated/` has new types
5. Run `pnpm typecheck` from repo root
6. If typecheck fails: flag which consumers need update
7. Commit: `chore(api): regenerate OpenAPI + TS SDK`

## Breaking changes

If any consumer breaks, use `api-contract-keeper` to assess:
- Can we keep backward compat?
- Should we create v2 endpoint?
- What's the deprecation timeline?
