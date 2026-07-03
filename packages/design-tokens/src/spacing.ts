/**
 * Spacing scale — Apple-based.
 *
 * Apple's base unit: 8px (with 17px md unit — the only odd-spacing token).
 * Section padding: 80px (Apple's tile rhythm — denser than typical SaaS).
 *
 * Apple's structural layout snaps to 8/12/17/24/32/48/80.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

export const spacing = {
  /** 4px — tight typographic adjustments */
  xxs: 4,
  /** 8px — base unit */
  xs: 8,
  /** 12px — sub-step */
  sm: 12,
  /** 17px — Apple's signature md unit (used in body padding/margin) */
  md: 17,
  /** 24px — utility card internal padding */
  lg: 24,
  /** 32px — major utility gutters */
  xl: 32,
  /** 48px — large internal padding */
  xxl: 48,
  /** 64px — Apple's tighter section padding (footers, dense utility blocks) */
  sectionTight: 64,
  /** 80px — Apple's tile section padding (denser than 96px Notion/Linear) */
  section: 80,
} as const;

/** Tailwind v3-compatible numeric scale (for apps still on v3). */
export const spacingScale = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.25: 17, // Apple's md
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80, // Apple section
  24: 96,
  32: 128,
} as const;

export type SpacingToken = keyof typeof spacing;
export type SpacingScaleToken = keyof typeof spacingScale;
