/**
 * Typography tokens — Apple-based foundation.
 *
 * Family discipline:
 *   - SF Pro Display: display sizes ≥ 19px (headlines, hero, lead)
 *   - SF Pro Text: body, captions, buttons, links below 20px
 *   - JetBrains Mono: code, IDs, kitchen tickets, prices
 *
 * Weight discipline (Apple's exact ladder):
 *   - 300 (light)    — luxury moments only (button-large, lead-airy)
 *   - 400 (regular)  — body, default running text
 *   - 600 (semibold) — display headings, tagline
 *   - 700 (bold)     — extremely rare
 *
 * Note: weight 500 is DELIBERATELY ABSENT in Apple's system.
 *
 * Apple's signature: 17px body (NOT 16px) — the "reading not scanning" pace.
 * Negative letter-spacing scales with size (-0.28px at 56px → 0 at 14px).
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

export const fontFamily = {
  /** Display sans — SF Pro Display for sizes ≥ 19px */
  display: "'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  /** Body sans — SF Pro Text for sizes < 20px */
  text: "'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  /** Mono — for code, IDs, kitchen tickets, prices */
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, Monaco, monospace",
} as const;

/**
 * Weight scale — locked to Apple's ladder.
 * Weight 500 is intentionally absent.
 */
export const fontWeight = {
  light: 300,        // luxury moments only
  regular: 400,      // body default
  semibold: 600,     // display headings
  bold: 700,         // extremely rare
} as const;

export const fontSize = {
  microLegal: 10,
  finePrint: 12,
  navLink: 12,
  caption: 14,
  buttonUtility: 14,
  body: 17,          // Apple's signature body size (NOT 16)
  bodyStrong: 17,
  buttonLarge: 18,   // weight 300 luxury button
  tagline: 21,
  leadAiry: 24,
  lead: 28,
  displayMd: 34,
  displayLg: 40,
  heroDisplay: 56,
} as const;

/**
 * Line-height scale — Apple's exact ladder.
 * Each key matches the textStyle that uses it (no aliasing confusion).
 */
export const lineHeight = {
  /** 1.0 — buttons + nav links (tight) */
  tight: 1.0,
  /** 1.07 — 56px hero-display */
  display: 1.07,
  /** 1.10 — 40px display-lg */
  displayLg: 1.10,
  /** 1.14 — 28px lead */
  leadDisplay: 1.14,
  /** 1.19 — 21px tagline */
  tagline: 1.19,
  /** 1.24 — 17px body-strong */
  bodyStrong: 1.24,
  /** 1.29 — 14px caption-strong */
  captionStrong: 1.29,
  /** 1.30 — 10/12px micro/fine print */
  microLegal: 1.30,
  /** 1.43 — 14px caption (regular) */
  caption: 1.43,
  /** 1.47 — Apple's signature body line-height (17px/400) — also display-md */
  body: 1.47,
  /** 1.47 — 34px display-md */
  displayMd: 1.47,
  /** 1.50 — 24px lead-airy */
  leadAiry: 1.50,
  /** 2.41 — Apple's distinctive relaxed footer link leading */
  denseLink: 2.41,
} as const;

export const letterSpacing = {
  /** Apple's signature negative tracking — scales with size */
  hero: -0.28,        // 56px hero
  displayLg: 0,       // 40px display
  displayMd: -0.374,  // 34px display
  taglineWide: 0.231, // 21px tagline (positive)
  leadWide: 0.196,    // 28px lead (positive)
  bodyStrong: -0.374,
  body: -0.374,
  caption: -0.224,
  navLink: -0.12,
  microLegal: -0.08,
  none: 0,
} as const;

/**
 * OpenType feature presets.
 * Apple uses default font features but enables `tnum` for tabular numerals
 * on financial/numeric displays (prices, KPIs, kitchen timers).
 */
export const fontFeatureSettings = {
  /** Tabular numerals — for receipts, prices, timers */
  tabular: '"tnum"',
  /** Mono ligatures */
  monoLiga: '"liga", "calt"',
  /** Default — Apple uses no special features by default */
  none: 'normal',
} as const;

/**
 * Semantic text presets — Apple's exact specs.
 * Use these via `textStyle.heroDisplay` etc. instead of composing raw tokens.
 */
export const textStyle = {
  // ─── Display sizes (SF Pro Display) ────────────────────────────────
  /** 56px hero — the iconic "Apple tight" headline cadence */
  heroDisplay: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.heroDisplay,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.display,
    letterSpacing: letterSpacing.hero,
  },
  /** 40px tile headline */
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.displayLg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.displayLg,
    letterSpacing: letterSpacing.displayLg,
  },
  /** 34px section head (SF Pro Text at display proportions) */
  displayMd: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.displayMd,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.displayMd,
    letterSpacing: letterSpacing.displayMd,
  },
  /** 28px lead — product tile subcopy */
  lead: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.leadDisplay,
    letterSpacing: letterSpacing.leadWide,
  },
  /** 24px / 300 / 1.5 — environment-page lead, the rare weight 300 */
  leadAiry: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.leadAiry,
    fontWeight: fontWeight.light,
    lineHeight: lineHeight.leadAiry,
    letterSpacing: letterSpacing.none,
  },
  /** 21px tagline — sub-tile + sub-nav */
  tagline: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.tagline,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tagline,
    letterSpacing: letterSpacing.taglineWide,
  },

  // ─── Body sizes (SF Pro Text) ──────────────────────────────────────
  /** 17px / 600 — emphasized body */
  bodyStrong: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodyStrong,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.bodyStrong,
    letterSpacing: letterSpacing.bodyStrong,
  },
  /** 17px / 400 / 1.47 — Apple's signature reading body */
  body: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
  },
  /** 17px / 400 / 2.41 — Apple's distinctive relaxed footer leading */
  denseLink: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.denseLink,
    letterSpacing: letterSpacing.none,
  },
  /** 14px / 400 / 1.43 — secondary captions, button text */
  caption: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.caption,
  },
  /** 14px / 600 / 1.29 — emphasized captions, footer column heads */
  captionStrong: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.captionStrong,
    letterSpacing: letterSpacing.caption,
  },

  // ─── Buttons ────────────────────────────────────────────────────────
  /** 18px / 300 — store hero CTA, the rare weight 300 */
  buttonLarge: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.buttonLarge,
    fontWeight: fontWeight.light,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.none,
  },
  /** 14px / 400 — utility/nav button labels */
  buttonUtility: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.buttonUtility,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.captionStrong,
    letterSpacing: letterSpacing.caption,
  },

  // ─── Captions / Fine print ─────────────────────────────────────────
  /** 12px / 400 — fine-print, footer body */
  finePrint: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.finePrint,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.navLink,
  },
  /** 10px / 400 — micro legal disclaimers */
  microLegal: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.microLegal,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.microLegal,
    letterSpacing: letterSpacing.microLegal,
  },
  /** 12px / 400 — global nav menu items */
  navLink: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.navLink,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.navLink,
  },

  // ─── Code / Mono ────────────────────────────────────────────────────
  /** 14px / 400 / 1.47 — code blocks */
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.none,
    fontFeatureSettings: fontFeatureSettings.monoLiga,
  },

  // ─── Tabular numerals — for prices, timers, KPIs ───────────────────
  tabular: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    fontFeatureSettings: fontFeatureSettings.tabular,
  },
  tabularLg: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.leadWide,
    fontFeatureSettings: fontFeatureSettings.tabular,
  },
  /** 56px tabular display — the only place in the system trusts type alone */
  tabularDisplay: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.heroDisplay,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.display,
    letterSpacing: letterSpacing.hero,
    fontFeatureSettings: fontFeatureSettings.tabular,
  },
} as const;

/**
 * Cyrillic tracking calibration.
 *
 * Apple's negative tracking is tuned for Latin glyphs. Cyrillic glyphs are
 * ~5% wider, so display tracking should be reduced by 20% to prevent collision.
 *
 * Apply when rendering uz-Cyrl, ru, kz strings at hero/displayLg sizes.
 */
export function adjustTrackingForCyrillic(latinTrackingPx: number): number {
  return latinTrackingPx * 0.8;
}

export type FontFamily = keyof typeof fontFamily;
export type FontWeight = keyof typeof fontWeight;
export type FontSize = keyof typeof fontSize;
export type TextStyle = keyof typeof textStyle;
