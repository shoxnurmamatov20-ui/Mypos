# @mypos/design-tokens

Shared design tokens for MyPOS — colors, typography, spacing, radius, shadows, breakpoints.

Used by all web apps, mobile apps, and email templates to ensure consistency.

## Usage

### Web (Tailwind)

```ts
// apps/web-dashboard/tailwind.config.ts
import { tailwindPreset } from '@mypos/design-tokens/tailwind';

export default {
  presets: [tailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

### Mobile (NativeWind)

```ts
// apps/mobile-staff/tailwind.config.ts
import { tailwindPreset } from '@mypos/design-tokens/tailwind';

export default {
  presets: [require('nativewind/preset'), tailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

### Direct import (no Tailwind)

```ts
import { colors, fontSize, spacing } from '@mypos/design-tokens';

const styles = {
  backgroundColor: colors.brand[500],
  padding: spacing[4],
  fontSize: fontSize.lg,
};
```

## Tokens

- **colors** — brand, mint, neutral, gold, purple + semantic (success, warning, danger, info)
- **typography** — fontFamily (Manrope, Inter, JetBrains Mono), fontSize, fontWeight, textStyle presets
- **spacing** — 4pt grid (0, 0.5, 1, ..., 96)
- **radius** — none, xs, sm, md, lg, xl, 2xl, 3xl, full
- **shadow** — web (CSS) and native (RN) variants
- **breakpoints** — sm(640), md(768), lg(1024), xl(1280), 2xl(1536), 3xl(1920)
- **theme** — lightTheme, darkTheme with semantic surface/text/brand mappings

## Guidelines

- Never hardcode hex colors in apps — use tokens.
- Never hardcode pixel sizes — use spacing scale.
- For brand-specific colors, add to `colors.ts` here (not in app).
