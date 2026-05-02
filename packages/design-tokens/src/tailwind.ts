/**
 * Tailwind CSS 4 preset — Apple-based foundation.
 *
 * Maps Apple design tokens to Tailwind utility classes.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 *
 * Usage:
 * ```ts
 * import { tailwindPreset } from '@mypos/design-tokens/tailwind';
 *
 * export default {
 *   presets: [tailwindPreset],
 *   content: ['./src/**\/*.{ts,tsx}'],
 * };
 * ```
 */

import { brand, apple, surface, hairline, text, semantic, status, aiStage } from './colors';
import { fontWeight, fontSize, lineHeight, letterSpacing, textStyle } from './typography';
import { spacing, spacingScale } from './spacing';
import { radius } from './radius';
import { shadow } from './shadows';
import { breakpoint } from './breakpoints';

const px = (n: number) => `${n}px`;

export const tailwindPreset = {
  theme: {
    // ─── Colors (Apple palette + MyPOS coral voltage) ───────────────────
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      // Brand voltage — MyPOS Coral (Apple's "single action color" applied)
      coral: brand.coral,
      'coral-active': brand.coralActive,
      'coral-focus': brand.coralFocus,
      'coral-soft': brand.coralSoft,
      'coral-tint': brand.coralTint,
      'coral-on-dark': brand.coralOnDark,

      // Tenant white-label (CSS variables — set by ResolveTenantFromDomain)
      tenant: 'var(--tenant-primary, #EA7C69)',
      'tenant-active': 'var(--tenant-primary-active, #d05848)',
      'tenant-focus': 'var(--tenant-primary-focus, #f78f74)',
      'tenant-soft': 'var(--tenant-primary-soft, #f9c4ba)',
      'tenant-tint': 'var(--tenant-primary-tint, #fef0ed)',
      'tenant-on-primary': 'var(--tenant-on-primary, #ffffff)',

      // Apple-pure variants (use when explicitly mimicking Apple chrome — login page, etc.)
      'apple-blue': apple.actionBlue,
      'apple-blue-focus': apple.actionBlueFocus,
      'apple-sky-on-dark': apple.skyOnDark,

      // Surfaces (Apple's exact tokens)
      canvas: surface.canvas,
      parchment: surface.parchment,
      pearl: surface.pearl,
      'tile-dark-1': surface.tileDark1,
      'tile-dark-2': surface.tileDark2,
      'tile-dark-3': surface.tileDark3,
      'pure-black': surface.pureBlack,

      // Hairlines
      hairline: hairline.base,
      'hairline-soft': hairline.soft,

      // Text (Apple's near-black + warm muted ladder)
      ink: text.ink,
      'ink-muted-80': text.inkMuted80,
      'ink-muted-48': text.inkMuted48,
      'on-dark': text.bodyOnDark,
      'on-dark-muted': text.bodyMuted,

      // Semantic
      success: semantic.success,
      'success-soft': semantic.successSoft,
      'success-text': semantic.successText,
      warning: semantic.warning,
      'warning-soft': semantic.warningSoft,
      'warning-text': semantic.warningText,
      error: semantic.error,
      'error-soft': semantic.errorSoft,
      'error-text': semantic.errorText,
      info: semantic.info,

      // Order status pipeline (functional — order surfaces only)
      'status-pending': status.pending,
      'status-preparing': status.preparing,
      'status-ready': status.ready,
      'status-served': status.served,
      'status-cancelled': status.cancelled,

      // AI Studio stage pills (scoped — AI surfaces only)
      'ai-recommending': aiStage.recommending,
      'ai-searching': aiStage.searching,
      'ai-reading': aiStage.reading,
      'ai-thinking': aiStage.thinking,
      'ai-translating': aiStage.translating,
      'ai-done': aiStage.done,

      // Compatibility aliases
      white: '#ffffff',
      black: '#000000',
    },

    // ─── Typography (SF Pro Display + SF Pro Text + Mono) ──────────────
    fontFamily: {
      sans: ['SF Pro Text', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      display: ['SF Pro Display', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['SF Mono', 'JetBrains Mono', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
    },

    /** Apple's exact font-size ladder, paired with line-height + tracking */
    fontSize: {
      'micro-legal': [px(fontSize.microLegal), { lineHeight: '1.30', letterSpacing: '-0.08px', fontWeight: '400' }],
      'fine-print': [px(fontSize.finePrint), { lineHeight: '1.0', letterSpacing: '-0.12px', fontWeight: '400' }],
      'nav-link': [px(fontSize.navLink), { lineHeight: '1.0', letterSpacing: '-0.12px', fontWeight: '400' }],
      caption: [px(fontSize.caption), { lineHeight: '1.43', letterSpacing: '-0.224px', fontWeight: '400' }],
      'caption-strong': [px(fontSize.caption), { lineHeight: '1.29', letterSpacing: '-0.224px', fontWeight: '600' }],
      body: [px(fontSize.body), { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '400' }],
      'body-strong': [px(fontSize.bodyStrong), { lineHeight: '1.24', letterSpacing: '-0.374px', fontWeight: '600' }],
      'button-large': [px(fontSize.buttonLarge), { lineHeight: '1.0', fontWeight: '300' }],
      tagline: [px(fontSize.tagline), { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '600' }],
      'lead-airy': [px(fontSize.leadAiry), { lineHeight: '1.50', fontWeight: '300' }],
      lead: [px(fontSize.lead), { lineHeight: '1.14', letterSpacing: '0.196px', fontWeight: '400' }],
      'display-md': [px(fontSize.displayMd), { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '600' }],
      'display-lg': [px(fontSize.displayLg), { lineHeight: '1.10', letterSpacing: '0', fontWeight: '600' }],
      'hero-display': [px(fontSize.heroDisplay), { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
    },

    fontWeight: {
      light: String(fontWeight.light),         // 300
      regular: String(fontWeight.regular),     // 400
      semibold: String(fontWeight.semibold),   // 600
      bold: String(fontWeight.bold),           // 700
      // Note: 500 deliberately absent (Apple's discipline)
    },

    lineHeight: Object.fromEntries(Object.entries(lineHeight).map(([k, v]) => [k, String(v)])),

    letterSpacing: Object.fromEntries(
      Object.entries(letterSpacing).map(([k, v]) => [k, `${v}px`])
    ),

    // ─── Spacing (Apple's 8px base + 17px md) ──────────────────────────
    spacing: {
      ...Object.fromEntries(Object.entries(spacingScale).map(([k, v]) => [k, px(v)])),
      // Named tokens
      px: '1px',
      xxs: px(spacing.xxs),
      xs: px(spacing.xs),
      sm: px(spacing.sm),
      md: px(spacing.md),                          // 17px — Apple signature
      lg: px(spacing.lg),
      xl: px(spacing.xl),
      xxl: px(spacing.xxl),
      'section-tight': px(spacing.sectionTight),   // 64px — footers, dense utility
      section: px(spacing.section),                // 80px — Apple tile rhythm
    },

    // ─── Border Radius (Apple's discipline) ────────────────────────────
    borderRadius: {
      none: '0',
      xs: px(radius.xs),       // 5px
      sm: px(radius.sm),       // 8px — dark utility buttons
      md: px(radius.md),       // 11px — pearl button
      pearl: px(radius.pearl), // 11px — alias for md (Apple's "Pearl Button")
      lg: px(radius.lg),       // 18px — utility cards
      card: px(radius.card),   // 18px — alias for lg
      pill: '9999px',          // PRIMARY CTAS — Apple's signature pill
      full: '9999px',
    },

    // ─── Shadows (Apple's discipline — minimal) ────────────────────────
    boxShadow: {
      none: 'none',
      product: shadow.product,           // THE single drop-shadow (product imagery only)
      'hairline-ring': shadow.hairlineRing,
      'pearl-ring': shadow.pearlRing,
      focus: shadow.focus,
      'focus-apple': shadow.focusApple,
    },

    // ─── Backdrop blur (frosted-glass) ─────────────────────────────────
    backdropBlur: {
      nav: '20px',
    },
    backdropSaturate: {
      nav: '1.8',
    },

    // ─── Breakpoints (Apple's exact structural specs) ──────────────────
    screens: {
      'phone-s': px(breakpoint.phoneS),
      phone: px(breakpoint.phone),
      'phone-l': px(breakpoint.phoneL),
      tablet: px(breakpoint.tablet),
      'tablet-l': px(breakpoint.tabletLandscape),
      'desktop-s': px(breakpoint.desktopS),
      desktop: px(breakpoint.desktop),
      'desktop-wide': px(breakpoint.desktopWide),
      // Tailwind aliases
      sm: px(breakpoint.sm),
      md: px(breakpoint.md),
      lg: px(breakpoint.lg),
      xl: px(breakpoint.xl),
      '2xl': px(breakpoint['2xl']),
      '3xl': px(breakpoint['3xl']),
    },

    extend: {
      // Custom keyframes
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        'pulse-urgent': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Match motion.ts easing (ease-out for pulses; decelerate for entries)
        pulse: 'pulse 2s ease-out infinite',
        'pulse-urgent': 'pulse-urgent 1.5s ease-out infinite',
        'fade-in-up': 'fade-in-up 800ms cubic-bezier(0, 0, 0.2, 1) forwards',
      },

      // Apple's exact easing curves (mirror motion.ts)
      transitionTimingFunction: {
        'apple-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'apple-decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'apple-accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
      },

      transitionDuration: {
        instant: '100ms',
        fast: '200ms',
        base: '320ms',
        slow: '400ms',
        slower: '600ms',
      },

      // Apple's signature press scale — utility for `active:scale-95`
      scale: {
        '95': '0.95',  // Apple's exact press transform
      },
    },
  },
};

/**
 * Helper: generate text style as CSS-in-JS object.
 * Use in components:
 *
 * ```tsx
 * import { textStyleAsCSS } from '@mypos/design-tokens/tailwind';
 *
 * <h1 style={textStyleAsCSS('heroDisplay')}>...</h1>
 * ```
 */
export function textStyleAsCSS(key: keyof typeof textStyle) {
  const style = textStyle[key];
  return {
    fontFamily: style.fontFamily,
    fontSize: px(style.fontSize),
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    ...('letterSpacing' in style ? { letterSpacing: px(style.letterSpacing as number) } : {}),
    ...('fontFeatureSettings' in style ? { fontFeatureSettings: style.fontFeatureSettings } : {}),
  };
}
