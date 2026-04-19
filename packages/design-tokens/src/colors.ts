/**
 * MyPOS color tokens.
 * Shared across web, mobile, and email templates.
 * Brand: warm orange-red + mint green — restaurant hospitality vibe.
 */

export const colors = {
  /** Brand primary — signature orange-red */
  brand: {
    50: '#FFF5F2',
    100: '#FFE4DC',
    200: '#FFC3B2',
    300: '#FFA188',
    400: '#F78F74',
    500: '#EA7C69',
    600: '#D5624E',
    700: '#B04A38',
    800: '#823528',
    900: '#5A2419',
  },

  /** Mint — success, positive states */
  mint: {
    50: '#F0FDF9',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#50D1AA',
    600: '#10B981',
    700: '#158C6E',
    800: '#065F46',
    900: '#064E3B',
  },

  /** Neutral — backgrounds, text */
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  /** Semantic colors */
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  /** Gold — VIP, featured, premium */
  gold: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    700: '#B45309',
    900: '#78350F',
  },

  /** Purple — AI features */
  purple: {
    50: '#FAF5FF',
    500: '#8B5CF6',
    700: '#6D28D9',
  },
} as const;

/**
 * Theme-aware color references.
 * Use these in components for light/dark mode consistency.
 */
export const lightTheme = {
  background: colors.neutral[50],
  surface: colors.neutral[0],
  surfaceElevated: colors.neutral[0],
  border: colors.neutral[200],
  borderStrong: colors.neutral[300],
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    inverse: colors.neutral[0],
  },
  brand: {
    primary: colors.brand[500],
    hover: colors.brand[600],
    active: colors.brand[700],
    subtle: colors.brand[50],
  },
} as const;

export const darkTheme = {
  background: colors.neutral[900],
  surface: colors.neutral[800],
  surfaceElevated: colors.neutral[700],
  border: colors.neutral[700],
  borderStrong: colors.neutral[600],
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[300],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[900],
  },
  brand: {
    primary: colors.brand[400],
    hover: colors.brand[300],
    active: colors.brand[500],
    subtle: colors.brand[900],
  },
} as const;

export type Theme = typeof lightTheme;
export type ColorScale = typeof colors.brand;
export type ColorToken = keyof typeof colors;
