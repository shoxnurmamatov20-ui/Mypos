# @mypos/config

Shared configuration presets — TypeScript, Biome, Tailwind.

## Usage

### TypeScript

```json
// apps/my-app/tsconfig.json
{
  "extends": "@mypos/config/typescript/base",
  "include": ["src"]
}
```

### Biome

Root `biome.json` already configured at repo level; this package extends for sub-apps.

### Tailwind

```ts
// apps/web-dashboard/tailwind.config.ts
import preset from '@mypos/design-tokens/tailwind';
import type { Config } from 'tailwindcss';

export default { presets: [preset], content: ['./src/**/*.{ts,tsx}'] } satisfies Config;
```

## Evolution

More presets as needed:
- `typescript/nextjs.json` — Next.js-specific
- `typescript/expo.json` — React Native-specific
- `typescript/node.json` — Node CLI / server
