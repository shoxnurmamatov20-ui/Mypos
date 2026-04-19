/**
 * Breakpoints for responsive design.
 * Tailwind-aligned.
 */

export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

/**
 * Device category inferred from breakpoint.
 */
export const device = {
  mobile: { min: 0, max: breakpoint.md - 1 },
  tablet: { min: breakpoint.md, max: breakpoint.xl - 1 },
  desktop: { min: breakpoint.xl, max: breakpoint['3xl'] - 1 },
  wide: { min: breakpoint['3xl'], max: Infinity },
} as const;

export type Breakpoint = keyof typeof breakpoint;
export type Device = keyof typeof device;
