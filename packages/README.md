# Packages

Shared TypeScript libraries used across apps. Keeps code DRY and types consistent.

## Inventory

| Package | Purpose | Status |
|---------|---------|:------:|
| [`design-tokens/`](./design-tokens/) | Colors, typography, spacing, shadows | 🟢 |
| `ui/` | Shared components (RN + Web, NativeWind) | 🔲 |
| `api-client/` | Auto-generated TS SDK from Laravel OpenAPI | 🔲 |
| `types/` | Shared domain types | 🔲 |
| `validation/` | Zod schemas (mirrors Laravel FormRequest) | 🔲 |
| `i18n/` | Shared translation keys (UZ/RU/EN) | 🔲 |
| `config/` | Shared TS/Biome/Tailwind configs | 🔲 |
| `utils/` | Currency, date, phone helpers | 🔲 |
| `feature-flags/` | Feature flag SDK wrapper | 🔲 |
| `analytics/` | Posthog wrapper | 🔲 |

## Conventions

- Every package has `package.json` with `"name": "@mypos/<name>"`
- `"private": true` — never published to npm (monorepo-internal)
- TS source in `src/`, exposed via `exports` map
- No `dist/` build step — consumers compile (via Next.js / Expo)
- Each package owns its `tsconfig.json` extending root
- Keep peer-deps minimal (share via workspace)

## Adding a new package

```bash
mkdir packages/<name>/src
cd packages/<name>
pnpm init  # then manually edit name to @mypos/<name>
```

Add to `pnpm-workspace.yaml` is automatic via glob.
