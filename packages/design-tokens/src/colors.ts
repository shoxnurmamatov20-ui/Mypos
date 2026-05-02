/**
 * MyPOS color tokens — Apple-based foundation.
 *
 * Foundation: Apple's design system (apple.com)
 * Brand voltage: MyPOS Coral #EA7C69 (replaces Apple's Action Blue role)
 *
 * Apple's discipline applied:
 *   - Single brand accent color (used scarcely)
 *   - Pure white + parchment alternation
 *   - Near-black ink #1d1d1f (NOT pure black)
 *   - Edge-to-edge dark tile variants for product showcase
 *   - Pure black ONLY in global nav and video frames
 *   - One drop-shadow only — for product photography
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

/**
 * MyPOS Coral — the platform brand voltage.
 * Apple's "single action color" rule applied: every primary CTA, link, focus
 * signal uses this color and ONLY this color. Used scarcely.
 */
export const brand = {
  coral: '#EA7C69',
  coralActive: '#d05848',
  coralFocus: '#f78f74',
  coralSoft: '#f9c4ba',
  coralTint: '#fef0ed',
  /** Lighter coral for inline links on dark surfaces (Apple's Sky Link Blue equivalent) */
  coralOnDark: '#ffa896',
} as const;

/**
 * Apple Action Blue — Apple-purity reference ONLY.
 *
 * ⚠️ DO NOT use these in normal MyPOS surfaces. The brand voltage is
 * `brand.coral` — Apple's "single action color" rule applied. These tokens
 * exist only for the rare case of explicitly mimicking Apple chrome (e.g.
 * an Apple-branded login screen demo).
 *
 * Default behavior: ignore this export.
 */
export const apple = {
  actionBlue: '#0066cc',
  actionBlueFocus: '#0071e3',
  skyOnDark: '#2997ff',
} as const;

/**
 * Surface palette — Apple's exact tokens.
 */
export const surface = {
  /** Pure white — page floor, cards, content surfaces */
  canvas: '#ffffff',
  /** Apple parchment — alternating light tile, footer, store utility */
  parchment: '#f5f5f7',
  /** Pearl — secondary "ghost" button fill on parchment */
  pearl: '#fafafc',
  /** Primary dark tile — product grid alternating dark band */
  tileDark1: '#272729',
  /** Micro-step lighter dark — separation between adjacent dark tiles */
  tileDark2: '#2a2a2c',
  /** Micro-step darker dark — bottom of stack, embedded video frames */
  tileDark3: '#252527',
  /** Pure black — reserved for global nav and true void only */
  pureBlack: '#000000',
} as const;

/**
 * Hairlines & borders — Apple's whisper-quiet 1px tones.
 */
export const hairline = {
  /** 1px hairline border on store utility cards and configurator chips */
  base: '#e0e0e0',
  /** Soft border tone — ring-shadow on secondary buttons (rgba(0,0,0,0.04) equivalent) */
  soft: '#f0f0f0',
} as const;

/**
 * Text palette — Apple's near-black + warm muted ladder.
 * Apple uses ONE near-black tone (#1d1d1f) for all text on light surfaces.
 * Pure black is deliberately avoided — keeps the page feeling photographic.
 */
export const text = {
  /** Near-black ink — voice of every headline, body, dark utility button */
  ink: '#1d1d1f',
  /** Same hex as ink — Apple uses one near-black for all light-surface text */
  body: '#1d1d1f',
  /** White on dark tiles and global nav */
  bodyOnDark: '#ffffff',
  /** Secondary copy on dark tiles — softer than pure white */
  bodyMuted: '#cccccc',
  /** Body on Pearl Button surface — slightly softer than pure black */
  inkMuted80: '#333333',
  /** Disabled button text + legal fine-print */
  inkMuted48: '#7a7a7a',
} as const;

/**
 * Translucent / chip surfaces — Apple's photo-overlay controls.
 */
export const overlay = {
  /** Translucent gray chip — base hex for `rgba(210, 210, 215, 0.64)` controls over photography */
  chipBase: '#d2d2d7',
  /** Modal scrim base — applied at 50% opacity */
  scrim: '#000000',
} as const;

/**
 * Semantic — minimal palette since Apple avoids decorative colors.
 * Only used for status indicators in product UI surfaces (POS, KDS).
 */
export const semantic = {
  /** Success / "ready" status indicators */
  success: '#28c840',
  successSoft: '#e8f6ec',
  successText: '#1aae39',
  /** Pending / waiting status */
  warning: '#ffbd2e',
  warningSoft: '#fef7d6',
  warningText: '#9b6829',
  /** Error / cancelled */
  error: '#ff5f57',
  errorSoft: '#fde0ec',
  errorText: '#c64545',
  /** Information (rare on Apple-styled surfaces) */
  info: '#0066cc',
  infoSoft: '#e6f0fb',
  infoText: '#0066cc',
} as const;

/**
 * Order Status Pipeline — functional, not decorative.
 * Used on order/kitchen/courier surfaces ONLY. Never on marketing chrome.
 * Apple's design discipline keeps these scoped to product UI only.
 *
 * Each status maps to a desaturated Apple-style status color. The pipeline
 * is read at a glance; saturation kept low to coexist with Apple's quiet
 * surface palette.
 */
export const status = {
  /** Awaiting kitchen — saffron */
  pending: '#d4a017',
  /** In flight — Apple Action Blue */
  preparing: '#0066cc',
  /** Ready for handoff — Apple green */
  ready: '#28c840',
  /** Closed/served — slate */
  served: '#7a7a7a',
  /** Cancelled — quiet error red */
  cancelled: '#c64545',
} as const;

/**
 * AI agent stage pills — Cursor-style timeline indicators.
 *
 * SCOPED TO AI Studio surfaces ONLY. Never on system action colors,
 * never on order pipeline. These exist because Apple's discipline doesn't
 * cover AI-conversation feedback — Cursor's stage-pill grammar fills the gap.
 *
 * Use only inside `apps/web-dashboard/src/app/(dashboard)/ai/*` and similar.
 */
export const aiStage = {
  recommending: '#dfa88f',
  searching: '#9fc9a2',
  reading: '#9fbbe0',
  thinking: '#c0a8dd',
  translating: '#f9c4ba',
  done: '#c08532',
} as const;

/**
 * Combined export for convenience.
 */
export const colors = {
  brand,
  apple,
  surface,
  hairline,
  text,
  overlay,
  semantic,
  status,
  aiStage,

  /** Flat aliases for direct access */
  primary: brand.coral,
  primaryActive: brand.coralActive,
  canvas: surface.canvas,
  parchment: surface.parchment,
  ink: text.ink,
} as const;

/**
 * Light theme — semantic surface/text/brand mappings.
 * The default Apple atmosphere: white canvas + parchment alternation + ink text.
 */
export const lightTheme = {
  background: surface.canvas,
  surface: surface.canvas,
  surfaceAlt: surface.parchment,
  surfaceElevated: surface.canvas,
  border: hairline.base,
  borderSoft: hairline.soft,
  text: {
    primary: text.ink,
    body: text.ink,
    secondary: text.inkMuted80,
    tertiary: text.inkMuted48,
    inverse: text.bodyOnDark,
  },
  brand: {
    primary: brand.coral,
    active: brand.coralActive,
    focus: brand.coralFocus,
    soft: brand.coralSoft,
    tint: brand.coralTint,
    onPrimary: '#ffffff',
  },
} as const;

/**
 * Dark theme — Apple's tile-dark variants.
 * Used on full-bleed dark product tiles (homepage product grid alternation).
 */
export const darkTheme = {
  background: surface.tileDark1,
  surface: surface.tileDark1,
  surfaceAlt: surface.tileDark2,
  surfaceElevated: surface.tileDark2,
  border: 'rgba(255, 255, 255, 0.10)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  text: {
    primary: text.bodyOnDark,
    body: text.bodyOnDark,
    secondary: text.bodyMuted,
    tertiary: 'rgba(255, 255, 255, 0.48)',
    inverse: text.ink,
  },
  brand: {
    primary: brand.coralOnDark,
    active: brand.coral,
    focus: brand.coralFocus,
    soft: 'rgba(234, 124, 105, 0.20)',
    tint: 'rgba(234, 124, 105, 0.10)',
    onPrimary: text.ink,
  },
} as const;

/**
 * Per-tenant white-label overrides.
 * Each tenant has a slug → color map; ResolveTenantFromDomain middleware
 * generates inline `<style>` setting CSS variables on `:root[data-tenant="..."]`.
 *
 * NEVER hardcode these in components — always reference `--tenant-primary`.
 *
 * Apple's discipline: single brand voltage per surface. Each tenant gets ONE
 * action color that replaces MyPOS Coral throughout their domain.
 */
export const tenantPresets = {
  default: {
    primary: brand.coral,
    primaryActive: brand.coralActive,
    primaryFocus: brand.coralFocus,
    primarySoft: brand.coralSoft,
    primaryTint: brand.coralTint,
    onPrimary: '#ffffff',
  },
  jomeBurger: {
    primary: '#ff5b1a',
    primaryActive: '#cc4416',
    primaryFocus: '#ff7d4d',
    primarySoft: '#ffd2b8',
    primaryTint: '#fff1e7',
    onPrimary: '#ffffff',
  },
  lavashHouse: {
    primary: '#2a9d99',
    primaryActive: '#1f7975',
    primaryFocus: '#3eb5b1',
    primarySoft: '#c8e6cd',
    primaryTint: '#e8f5f4',
    onPrimary: '#ffffff',
  },
  choyxona: {
    primary: '#7b3ff2',
    primaryActive: '#5e2fb8',
    primaryFocus: '#9460f7',
    primarySoft: '#d6b6f6',
    primaryTint: '#f3edfe',
    onPrimary: '#ffffff',
  },
} as const;

export type Theme = typeof lightTheme;
export type TenantPreset = keyof typeof tenantPresets;
export type ColorToken = keyof typeof colors;
export type StatusKey = keyof typeof status;
