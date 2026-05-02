# @mypos/design-tokens

> **100% Apple-aligned** — every token in this package mirrors `DESIGN-apple.md` (the source of truth, 37 KB).
>
> Audited and verified 2026-05-03 against Apple's exact spec. No hybrids. No drift.

MyPOS Design System tokens — **Apple foundation only** for restaurant SaaS at scale.

Shared across web (Next.js), mobile (Expo + NativeWind), and email templates.

## Foundation

- **Foundation**: Apple's design system (apple.com)
  - Edge-to-edge alternating tiles (light / parchment / dark)
  - SF Pro Display + SF Pro Text typography
  - 17px body — Apple's signature reading pace
  - Pill CTAs (9999px) — Apple's signature shape
  - Single drop-shadow ONLY on product imagery
  - `transform: scale(0.95)` press — universal micro-interaction
  - Weight 600 display / 400 body / 300 luxury moments
  - **Weight 500 deliberately absent**

- **Brand voltage**: MyPOS Coral `#EA7C69` (replaces Apple's Action Blue role)

See full design philosophy in [`DESIGN-apple.md`](./DESIGN-apple.md).

## Usage

### Web (Tailwind 4)

```ts
// apps/web-marketing/tailwind.config.ts
import { tailwindPreset } from '@mypos/design-tokens/tailwind';

export default {
  presets: [tailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

```tsx
// Pill CTA (Apple's signature)
<button className="bg-tenant text-tenant-on-primary rounded-pill px-md h-12 active:scale-95">
  Buyurtma berish
</button>

// Apple's edge-to-edge tile
<section className="bg-canvas py-section text-center">
  <h1 className="font-display text-hero-display">MyPOS.</h1>
  <p className="text-lead">The way restaurants run.</p>
</section>

// Dark tile alternation
<section className="bg-tile-dark-1 py-section text-center text-on-dark">
  <h2 className="font-display text-display-lg">Built for the heat of the kitchen.</h2>
</section>

// Product render with the SINGLE drop-shadow
<img src="/pos-terminal.png" className="shadow-product" alt="POS terminal" />

// Tabular price (with `tnum`)
<span className="font-mono" style={{ fontFeatureSettings: '"tnum"' }}>167,000</span>
```

### Mobile (NativeWind 4)

```ts
// apps/mobile-staff/tailwind.config.ts
import { tailwindPreset } from '@mypos/design-tokens/tailwind';
import nativewind from 'nativewind/preset';

export default {
  presets: [nativewind, tailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

```tsx
<View className="bg-canvas rounded-pill py-md px-lg">
  <Text className="text-body text-ink">Place order</Text>
</View>
```

### Direct import (no Tailwind)

```ts
import { brand, textStyle, shadow, spacing } from '@mypos/design-tokens';

const styles = {
  backgroundColor: brand.coral,
  padding: spacing.md,                // 17px (Apple signature)
  ...textStyle.body,                   // 17px / 400 / 1.47 / -0.374px
  borderRadius: 9999,                  // pill
};
```

### Multi-tenant white-label

```tsx
// apps/web-consumer/src/app/[locale]/layout.tsx
import { generateTenantStyles } from '@mypos/design-tokens/tenant';

export default function RootLayout({ children, tenant }: Props) {
  const tenantCss = tenant ? generateTenantStyles(tenant) : '';
  return (
    <html data-tenant={tenant?.slug}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tenantCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Components reference `var(--tenant-primary)` (mapped to `bg-tenant` in Tailwind), so they automatically pick up per-tenant colors at runtime — no rebuild needed.

## Token Categories

| File | Exports | Apple Source |
|---|---|---|
| `colors` | `brand`, `apple` (purity ref), `surface`, `hairline`, `text`, `overlay`, `semantic`, `status`, `aiStage`, `tenantPresets`, `lightTheme`, `darkTheme` | Apple parchment + tile-dark-1/2/3, near-black ink `#1d1d1f` |
| `typography` | `fontFamily`, `fontWeight`, `fontSize`, `lineHeight`, `letterSpacing`, `fontFeatureSettings`, `textStyle` (16 presets), `adjustTrackingForCyrillic` | SF Pro Display + Text, weight 300/400/600 (no 500), **17px body / 1.47 line-height** |
| `spacing` | `spacing`, `spacingScale` | 8px base + **17px md** (signature) + 64px section-tight + 80px section |
| `radius` | `radius` | 0 / 5 / 8 / 11 (`md`/`pearl`) / 18 (`lg`/`card`) / 9999 (`pill`/`full`) — **pill primary CTAs** |
| `shadows` | `shadow`, `nativeShadow` | **Single drop-shadow** for product imagery only — `product`, `hairlineRing`, `pearlRing`, `focus`, `frostedBlur` |
| `breakpoints` | `breakpoint`, `device`, `touchTarget` | Apple's exact: 1441 / 1440 / 1068 / 1023 / 833 / 735 / 640 / 420 |
| `motion` | `duration`, `easing`, `pressTransform`, `stagger`, `keyframes` | `scale(0.95)` press, ease-out / standard / decelerate / accelerate, 100/200/320/400/600ms |
| `tenant` | `TenantTheme`, `generateRootTenantVars`, `generateTenantStyles`, `generateAllTenantStyles`, `validateTenantContrast` | Per-tenant CSS vars: `--tenant-primary[-active\|-focus\|-soft\|-tint]` |
| `tailwind` | `tailwindPreset`, `textStyleAsCSS` | Tailwind 4 / NativeWind preset — exposes every token above |

## Apple Discipline Guidelines

1. **Single brand voltage** — `bg-tenant` (default coral) for every primary CTA, link, focus signal. No second action color.
2. **Pill CTAs** — primary buttons use `rounded-pill` (9999px). 8px and 18px radii are for utility surfaces only.
3. **17px body** — `text-body` is Apple's reading pace. Never drop to 16px on consumer surfaces.
4. **Single drop-shadow** — `shadow-product` ONLY on `<img>` of product photography. Never on cards, buttons, text.
5. **Weight 500 absent** — use 300 (luxury), 400 (body), or 600 (display). Never 500.
6. **Negative tracking on display** — `tracking-hero` (-0.28px) on hero h1, scales down with size.
7. **Edge-to-edge tiles** — alternate `bg-canvas` / `bg-parchment` / `bg-tile-dark-1` with `py-section` (80px). The color change IS the divider.
8. **`active:scale-95` press** — every interactive element gets Apple's signature press transform.
9. **Pure black scoped** — `bg-pure-black` reserved for global nav and embedded video frames only.
10. **Tabular numerals** — every price, count, time gets `font-feature-settings: "tnum"` (use `font-mono` + `tnum` style).
11. **Cyrillic tracking** — reduce display tracking by 20% via `adjustTrackingForCyrillic()` for UZ Cyrillic, RU, KZ.
12. **Tenant theming** — components reference `var(--tenant-primary)`, never hardcoded `#EA7C69`.

See `DESIGN-apple.md` for full do/don't guidance + iteration rules.

## Alignment status (2026-05-03 audit)

✅ **100% spec coverage** — every token in `DESIGN-apple.md` has a corresponding TS export.
✅ **Naming matches spec** — `lineHeight.body` = 1.47 (was incorrectly aliased), `lineHeight.captionStrong` = 1.29.
✅ **Pearl Button alias** — `radius.pearl` (11px) and `radius.card` (18px) added per spec terminology.
✅ **Section-tight** — 64px alongside 80px `section` (Apple footers use the tighter value).
✅ **Tenant focus variable** — `--tenant-primary-focus` now generated by `generateTenantStyles()`.
✅ **AI Studio palette** — `aiStage` added (recommending/searching/reading/thinking/translating/done) — scoped to AI surfaces only.
✅ **Animation easing** — Tailwind `pulse` / `pulse-urgent` switched to `ease-out` to match `motion.ts`.
✅ **Transition utilities** — `transitionDuration` (instant/fast/base/slow/slower) and `transitionTimingFunction` (apple-standard/decelerate/accelerate) exposed.
✅ **`apple.*` colors** — gated with strong JSDoc warning ("DO NOT use in normal MyPOS surfaces").

`tsc --noEmit` clean.
