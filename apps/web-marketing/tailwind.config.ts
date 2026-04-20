import { tailwindPreset } from '@mypos/design-tokens/tailwind';
import type { Config } from 'tailwindcss';

export default {
  presets: [tailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config;
