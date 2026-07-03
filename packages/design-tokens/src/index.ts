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

// Breakpoints
export {
  type Breakpoint,
  breakpoint,
  type Device,
  device,
  type TouchTarget,
  touchTarget,
} from './breakpoints';
// Colors
export {
  aiStage,
  apple,
  brand,
  type ColorToken,
  colors,
  darkTheme,
  hairline,
  lightTheme,
  overlay,
  type StatusKey,
  semantic,
  status,
  surface,
  type TenantPreset,
  type Theme,
  tenantPresets,
  text,
} from './colors';
// Motion
export {
  type Duration,
  duration,
  type Easing,
  easing,
  keyframes,
  pressTransform,
  type Stagger,
  stagger,
} from './motion';

// Radius
export { type RadiusToken, radius } from './radius';

// Shadows
export { type NativeShadowToken, nativeShadow, type ShadowToken, shadow } from './shadows';
// Spacing
export { type SpacingScaleToken, type SpacingToken, spacing, spacingScale } from './spacing';
// Tailwind preset
export { tailwindPreset, textStyleAsCSS } from './tailwind';

// Tenant white-label
export {
  generateAllTenantStyles,
  generateRootTenantVars,
  generateTenantStyles,
  type TenantTheme,
  validateTenantContrast,
} from './tenant';
// Typography
export {
  adjustTrackingForCyrillic,
  type FontFamily,
  type FontSize,
  type FontWeight,
  fontFamily,
  fontFeatureSettings,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  type TextStyle,
  textStyle,
} from './typography';
