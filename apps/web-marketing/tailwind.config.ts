import { tailwindPreset } from '@mypos/design-tokens/tailwind';
import type { Config } from 'tailwindcss';

// Tailwind v4: @config directive loads this file. Presets are not supported
// in v4 — flatten the Apple preset into theme.extend instead.
const { extend: presetExtend = {}, ...presetBase } = tailwindPreset.theme;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      ...presetBase,
      ...presetExtend,
    },
  },
} satisfies Config;
