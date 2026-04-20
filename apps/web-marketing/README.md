# @mypos/web-marketing

Marketing / landing site for MyPOS — aimed at restaurant owners evaluating the product.

## Stack

- Next.js 15 (App Router, SSG) + React 19 + TypeScript 5.9 (strict)
- Tailwind CSS 4 (Oxide)
- next-intl (UZ / RU / EN — UZ default)
- lucide-react (icons)
- `@mypos/design-tokens` preset for brand colors and type

## Run locally

```bash
# from repo root
pnpm install
pnpm --filter @mypos/web-marketing dev
```

Dev server runs on http://localhost:3007. `/` redirects to `/uz` by default via next-intl middleware.

## Build (SSG)

```bash
pnpm --filter @mypos/web-marketing build
```

All pages (`/uz/*`, `/ru/*`, `/en/*`) are pre-rendered to static HTML. No API calls at runtime.

## Structure

```
apps/web-marketing/
├── messages/                   — i18n JSON (uz, ru, en)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── [locale]/
│   │       ├── layout.tsx      — NextIntlClientProvider + Inter/Manrope + SEO
│   │       ├── page.tsx        — Landing (all sections)
│   │       ├── features/page.tsx
│   │       ├── pricing/page.tsx
│   │       ├── about/page.tsx
│   │       ├── contact/page.tsx
│   │       └── blog/page.tsx
│   ├── components/landing/     — Hero, Features, Pricing, FAQ, etc.
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
```
