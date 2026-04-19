# @mypos/pos-terminal

Cashier-facing **POS terminal** app for MyPOS — built with Expo SDK 54 + React Native 0.81.

## Target devices

- **iPad** (iOS, landscape)
- **Android tablets** (landscape)

The app is **landscape-only** and optimized for tablet form factors. Phone layouts are **not** supported.

## Stack

- Expo SDK 54 (managed workflow, New Architecture enabled)
- Expo Router 6 (file-based routing, typed routes)
- React 19 / React Native 0.81
- TypeScript 5.9 (strict)
- NativeWind 4 (Tailwind for RN) — consumes `@mypos/design-tokens`
- TanStack Query 5 — server state
- Zustand 5 — client state
- react-hook-form + zod — forms & validation
- i18next + react-i18next — UZ / RU / EN
- expo-secure-store — auth tokens (never AsyncStorage for secrets)

## Running

> Docker stack, Laravel API, and app icons are not yet wired up. Do not try to run until those land.

```bash
# from the monorepo root
pnpm install

# from this folder
pnpm --filter @mypos/pos-terminal start      # dev server
pnpm --filter @mypos/pos-terminal ios        # iPad simulator
pnpm --filter @mypos/pos-terminal android    # Android tablet emulator
pnpm --filter @mypos/pos-terminal web        # web (development only)
```

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `start`           | `expo start --clear`                     |
| `ios` / `android` | Launch platform simulator                |
| `web`             | Run web target (dev aid only)            |
| `lint`            | Biome check                              |
| `typecheck`       | `tsc --noEmit`                           |
| `clean`           | Remove `.expo`, `node_modules`, `.turbo` |

## Directory layout

```
app/                  # Expo Router file-based routes
  _layout.tsx         # Root stack — providers live here
  index.tsx           # Welcome screen
src/
  i18n/               # i18next setup + uz/ru/en locales
assets/               # icons, fonts, images (real icons TBD)
global.css            # NativeWind entrypoint
tailwind.config.js    # consumes @mypos/design-tokens preset
app.json              # Expo config (landscape, iPad, etc.)
```

## Conventions

- Never hardcode user-facing strings — use `useTranslation()` with keys in `src/i18n/locales/`.
- Auth tokens and PINs go through `expo-secure-store`.
- Screens ≤ 200 lines; extract components otherwise.
- Typed params via `useLocalSearchParams<{...}>()`.
- Offline-first: menu cached, orders queued locally when the network drops.

See the root `CLAUDE.md` and `.claude/agents/expo-screen-dev.md` for full guidelines.
