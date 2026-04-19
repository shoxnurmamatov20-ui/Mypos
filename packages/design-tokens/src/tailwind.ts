/**
 * Tailwind CSS 4 preset using design tokens.
 * Import into each app's tailwind.config.ts.
 */

import { colors } from './colors';
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadow } from './shadows';
import { breakpoint } from './breakpoints';

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        mint: colors.mint,
        neutral: colors.neutral,
        gold: colors.gold,
        purple: colors.purple,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        info: colors.info,
      },
      fontFamily: {
        display: [fontFamily.display, 'system-ui', 'sans-serif'],
        sans: [fontFamily.body, 'system-ui', 'sans-serif'],
        mono: [fontFamily.mono, 'ui-monospace', 'monospace'],
      },
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([k, v]) => [k, `${v}px`]),
      ),
      fontWeight: Object.fromEntries(
        Object.entries(fontWeight).map(([k, v]) => [k, String(v)]),
      ),
      lineHeight,
      letterSpacing: Object.fromEntries(
        Object.entries(letterSpacing).map(([k, v]) => [k, `${v}px`]),
      ),
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([k, v]) => [k, `${v}px`]),
      ),
      borderRadius: Object.fromEntries(
        Object.entries(radius).map(([k, v]) => [k, typeof v === 'number' ? `${v}px` : v]),
      ),
      boxShadow: shadow,
      screens: Object.fromEntries(
        Object.entries(breakpoint).map(([k, v]) => [k, `${v}px`]),
      ),
    },
  },
};
