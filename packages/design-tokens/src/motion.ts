/**
 * Motion tokens — Apple's restrained motion philosophy.
 *
 * Apple's signature mikrodialog: `transform: scale(0.95)` on every active/press state.
 * This is the system-wide micro-interaction across all interactive elements.
 *
 * All animations gated by `@media (prefers-reduced-motion: no-preference)`.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

export const duration = {
  /** Press / hover micro-interaction */
  instant: 100,
  /** Standard component reveal */
  fast: 200,
  /** Modal open, route change */
  base: 320,
  /** Hero entrance */
  slow: 400,
  /** Page transition */
  slower: 600,
} as const;

export const easing = {
  /** Material standard — fast-out, slow-in */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Decelerate — for entering elements */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Accelerate — for exiting elements */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Smooth ease-out (default for hover/state changes) */
  easeOut: 'ease-out',
} as const;

/**
 * Apple's signature press transform — applied to every interactive element on `:active`.
 * This is non-negotiable across the system.
 */
export const pressTransform = 'scale(0.95)';

/**
 * Stagger delays for sequenced reveals.
 * Used on hero entrance, list animations.
 */
export const stagger = {
  fast: 60,
  base: 100,
  slow: 200,
} as const;

/**
 * Common keyframe animation specs.
 * Apple's discipline: motion communicates state changes, never decoration.
 */
export const keyframes = {
  /** Used on status pulses (success ready indicators) */
  pulse: {
    name: 'pulse',
    duration: 2000,
    easing: easing.easeOut,
    iterations: 'infinite',
    keyframes: {
      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
      '50%': { opacity: 0.6, transform: 'scale(1.2)' },
    },
  },
  /** Urgent indicators (KDS overdue tickets) */
  pulseUrgent: {
    name: 'pulseUrgent',
    duration: 1500,
    easing: easing.easeOut,
    iterations: 'infinite',
    keyframes: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.7 },
    },
  },
  /** Standard fade-in-up entrance for hero text and cards */
  fadeInUp: {
    name: 'fadeInUp',
    duration: 800,
    easing: easing.decelerate,
    iterations: 1,
    keyframes: {
      from: { opacity: 0, transform: 'translateY(8px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  },
} as const;

export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Stagger = keyof typeof stagger;
