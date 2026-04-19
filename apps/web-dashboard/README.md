# @mypos/web-dashboard

Manager dashboard for MyPOS — restaurant operators manage menu, staff, orders, analytics, and settings.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5.9 (strict)
- Tailwind CSS 4 (Oxide)
- next-intl (UZ / RU / EN)
- @tanstack/react-query v5 (server state)
- zustand v5 (client state)
- react-hook-form + zod (forms)
- sonner (toasts), lucide-react (icons)
- `@mypos/design-tokens` for design system

## Run locally

```bash
# from repo root
pnpm install
pnpm --filter @mypos/web-dashboard dev
```

Dev server runs on http://localhost:3001. `/` redirects to `/uz` by default (via next-intl middleware).

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start Next.js dev server on port 3001 |
| `build` | Production build |
| `start` | Start production server |
| `lint` | Run Biome linter |
| `typecheck` | Type-check with tsc |
| `clean` | Remove `.next` and `.turbo` |

## Structure

```
apps/web-dashboard/
├── messages/                   — i18n JSON (uz, ru, en)
├── src/
│   ├── app/
│   │   ├── globals.css         — Tailwind + theme
│   │   └── [locale]/
│   │       ├── layout.tsx      — Root layout (fonts, providers, i18n)
│   │       ├── page.tsx        — Home
│   │       └── providers.tsx   — React Query
│   ├── i18n/
│   │   ├── routing.ts          — Locales config
│   │   └── request.ts          — Per-request message loader
│   └── middleware.ts           — next-intl locale middleware
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Conventions

- Default to Server Components. `'use client'` only for interactivity.
- Mutations → Server Actions when possible; otherwise `useMutation`.
- Forms: `react-hook-form` + `zodResolver` (Zod from `@mypos/validation`).
- i18n keys pattern: `domain.section.key` — never hardcode user-facing strings.
- Route structure: `src/app/[locale]/(dashboard)/<feature>/page.tsx` with `loading.tsx` + `error.tsx`.

See `.claude/agents/nextjs-page-dev.md` at repo root for full conventions.
