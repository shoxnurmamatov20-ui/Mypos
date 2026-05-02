/**
 * Border radius tokens — Apple-based.
 *
 * Apple's radius discipline:
 *   - 0px (none) — full-bleed product tiles, edge-to-edge surfaces
 *   - 5px (xs) — inline link chips (rare)
 *   - 8px (sm) — dark utility buttons (Sign In, Bag), inline card imagery
 *   - 11px (md) — white Pearl Button capsules
 *   - 18px (lg) — store utility cards, accessories grid cards
 *   - 9999px (pill) — primary blue pill CTAs, sub-nav buy button, configurator chips, search input
 *   - 9999px (full) — circular control chips floating over photography
 *
 * The signature: PILL primary CTAs (`pill` 9999px) — Apple's signature shape.
 * 8px / 11px / 18px form the secondary "rectangular" grammar for utility surfaces.
 *
 * @see packages/design-tokens/DESIGN-apple.md
 */

export const radius = {
  /** 0px — full-bleed product tiles, edge-to-edge surfaces */
  none: 0,
  /** 5px — inline links styled as subtle chips (rare) */
  xs: 5,
  /** 8px — dark utility buttons, inline card imagery */
  sm: 8,
  /** 11px — white Pearl Button capsules (Apple's pearl-md radius) */
  md: 11,
  /** 11px — Apple "Pearl Button" alias for `md` (use whichever reads clearer) */
  pearl: 11,
  /** 18px — store utility cards, accessories grid cards (Apple's signature card radius) */
  lg: 18,
  /** 18px — `lg` alias when context calls it "card" */
  card: 18,
  /** 9999px — PRIMARY CTAS (Apple's pill signature) */
  pill: 9999,
  /** 9999px / 50% — circular control chips */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
