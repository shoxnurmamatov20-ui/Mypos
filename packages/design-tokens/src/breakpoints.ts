/**
 * Responsive breakpoints — Apple-based.
 *
 * Apple's exact structural breakpoints (the ones that matter for agents):
 *   - 1440px — content lock width
 *   - 1068px — small-desktop transition
 *   - 833px — tablet landscape switch
 *   - 734px — tablet portrait
 *   - 640px — phone
 *   - 480px — small phone
 *
 * @see packages/design-tokens/DESIGN-apple.md §Responsive Behavior
 */

export const breakpoint = {
  /** ≤ 419px — small phone */
  phoneS: 420,
  /** 420–640px — phone */
  phone: 640,
  /** 641–735px — large phone (tighter padding) */
  phoneL: 735,
  /** 736–833px — tablet portrait */
  tablet: 833,
  /** 834–1023px — tablet landscape */
  tabletLandscape: 1023,
  /** 1024–1068px — small desktop */
  desktopS: 1068,
  /** 1069–1440px — desktop */
  desktop: 1440,
  /** ≥ 1441px — wide desktop */
  desktopWide: 1441,

  /** Tailwind aliases (for compatibility) */
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
  '3xl': 1920,
} as const;

/**
 * Device categories inferred from breakpoint.
 */
export const device = {
  phone: { min: 0, max: breakpoint.phone - 1 },
  tablet: { min: breakpoint.phone, max: breakpoint.tablet - 1 },
  desktop: { min: breakpoint.tablet, max: breakpoint.desktop - 1 },
  wide: { min: breakpoint.desktop, max: Infinity },
} as const;

/**
 * Touch target minimum sizes per surface (Apple's WCAG AAA targets).
 *
 * Apple's exact guidance:
 *   - Primary CTAs: minimum 48×48 (above WCAG AAA)
 *   - Search orb: 48×48 circular (most-tapped element)
 *   - Heart save button: 32×32 (borderline AAA, compensated by 12px padding)
 *   - Date-picker day cells: 40×40 circular
 */
export const touchTarget = {
  /** 48px — primary CTAs */
  primary: 48,
  /** 44px — Apple's icon-button-circular standard */
  iconButton: 44,
  /** 40px — date picker day cells */
  dateCell: 40,
  /** 32px — small icon buttons (heart, save) */
  smallIcon: 32,
  /** 80px — kiosk + POS landscape touch-XL grammar */
  touchXL: 80,
} as const;

export type Breakpoint = keyof typeof breakpoint;
export type Device = keyof typeof device;
export type TouchTarget = keyof typeof touchTarget;
