/**
 * Shadow tokens — Apple-based discipline.
 *
 * Apple uses EXACTLY ONE drop-shadow in the entire system, applied ONLY to
 * product imagery resting on a surface. There are NO shadows on cards,
 * buttons, or text. Elevation comes from:
 *   1. Surface-color change (light tile ↔ dark tile)
 *   2. Backdrop-blur on sticky bars (sub-nav, floating-bar)
 *
 * The single shadow is about giving product photography weight, not about
 * UI hierarchy.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

export const shadow = {
  none: 'none',

  /**
   * The single drop-shadow — Apple's discipline.
   * Used ONLY on product imagery resting on a surface.
   *
   * Examples:
   *   - iPhone render on the homepage hero
   *   - Apple Watch bands floating above their backdrop
   *   - AirPods reflections in the catalog
   *
   * NEVER use this on: cards, buttons, text, modals, navigation, popovers.
   */
  product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',

  /**
   * Soft hairline border — for utility cards on parchment.
   * Functions as a 1px ring rather than a visible drop shadow.
   * Equivalent to: 1px solid rgba(0, 0, 0, 0.04)
   */
  hairlineRing: 'inset 0 0 0 1px rgba(0, 0, 0, 0.04)',

  /**
   * Pearl button inner ring — Apple's distinctive "soft ring" effect.
   * Used on `btn-pearl-capsule` style buttons.
   */
  pearlRing: 'inset 0 0 0 3px #f0f0f0',

  /**
   * Focus ring — keyboard focus on every interactive element.
   * Apple uses Action Blue here; for MyPOS we use brand coral.
   */
  focus: '0 0 0 2px #EA7C69',
  /** Apple Action Blue focus (kept for compatibility) */
  focusApple: '0 0 0 2px #0071e3',

  /**
   * Frosted-glass backdrop — for sub-nav and floating sticky bar.
   * NOT a shadow per se, but used in combination with backdrop-filter:
   * background: rgba(245, 245, 247, 0.8) + backdrop-filter: blur(20px) saturate(180%)
   */
  frostedBg: 'rgba(245, 245, 247, 0.8)',
  frostedBlur: 'blur(20px) saturate(180%)',
} as const;

/**
 * React Native shadow tokens.
 * iOS uses shadow* props; Android uses elevation.
 *
 * Apple's discipline applied to RN: only product imagery gets a shadow.
 * Cards on RN should NOT have shadows — use surface-color contrast instead.
 */
export const nativeShadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** The single product drop-shadow — for `<Image source={...productPhoto} style={{...nativeShadow.product}}/>` */
  product: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 16,
  },
} as const;

export type ShadowToken = keyof typeof shadow;
export type NativeShadowToken = keyof typeof nativeShadow;
