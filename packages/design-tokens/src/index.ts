/**
 * @mypos/design-tokens
 *
 * MyPOS Design System — Apple-based foundation.
 *
 * Foundation: Apple's design system (apple.com)
 *   - Edge-to-edge alternating tiles (light / parchment / dark)
 *   - SF Pro Display + SF Pro Text typography
 *   - 17px body — Apple's signature reading pace
 *   - Pill CTAs (9999px) — Apple's signature shape
 *   - Single drop-shadow ONLY on product imagery
 *   - transform: scale(0.95) press — universal micro-interaction
 *   - Weight 600 display / 400 body / 300 luxury, weight 500 deliberately absent
 *
 * Brand voltage: MyPOS Coral #EA7C69 (replaces Apple's Action Blue role).
 * Apple's "single action color" rule applied: every primary CTA, link, focus
 * signal uses coral and ONLY coral. Used scarcely.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

// Colors
export {
  colors,
  brand,
  apple,
  surface,
  hairline,
  text,
  overlay,
  semantic,
  status,
  aiStage,
  lightTheme,
  darkTheme,
  tenantPresets,
  type Theme,
  type TenantPreset,
  type ColorToken,
  type StatusKey,
} from './colors';

// Typography
export {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  fontFeatureSettings,
  textStyle,
  adjustTrackingForCyrillic,
  type FontFamily,
  type FontWeight,
  type FontSize,
  type TextStyle,
} from './typography';

// Spacing
export { spacing, spacingScale, type SpacingToken, type SpacingScaleToken } from './spacing';

// Radius
export { radius, type RadiusToken } from './radius';

// Shadows
export { shadow, nativeShadow, type ShadowToken, type NativeShadowToken } from './shadows';

// Breakpoints
export { breakpoint, device, touchTarget, type Breakpoint, type Device, type TouchTarget } from './breakpoints';

// Motion
export {
  duration,
  easing,
  pressTransform,
  stagger,
  keyframes,
  type Duration,
  type Easing,
  type Stagger,
} from './motion';

// Tenant white-label
export {
  generateRootTenantVars,
  generateTenantStyles,
  generateAllTenantStyles,
  validateTenantContrast,
  type TenantTheme,
} from './tenant';

// Tailwind preset
export { tailwindPreset, textStyleAsCSS } from './tailwind';
