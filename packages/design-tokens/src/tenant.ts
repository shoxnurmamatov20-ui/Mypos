/**
 * Multi-tenant white-label tokens — runtime CSS custom property override.
 *
 * The MyPOS architecture: every tenant-themed surface uses CSS variables
 * (`--tenant-primary`, `--tenant-primary-active`, etc.) instead of hard-coded hex.
 *
 * The Laravel `ResolveTenantFromDomain` middleware sets `[data-tenant="<slug>"]`
 * on the document root, and the per-tenant CSS variable values flow through.
 *
 * This file generates the inline `<style>` block server-side so the
 * variables are set BEFORE any component renders (no FOUC).
 *
 * @see docs/.md/DESIGN.md §2 Multi-Tenant White-Label Architecture
 */

import { tenantPresets } from './colors';

/**
 * Generate CSS custom properties for a tenant theme.
 * Returns a string of CSS rules to be inlined in the document `<head>`.
 *
 * @example
 * ```tsx
 * import { generateTenantStyles } from '@mypos/design-tokens/tenant';
 *
 * export default function RootLayout({ children, tenant }: Props) {
 *   return (
 *     <html data-tenant={tenant.slug}>
 *       <head>
 *         <style dangerouslySetInnerHTML={{ __html: generateTenantStyles(tenant) }} />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export interface TenantTheme {
  slug: string;
  primary: string;
  primaryActive?: string;
  primaryFocus?: string;
  primarySoft?: string;
  primaryTint?: string;
  onPrimary?: string;
}

/**
 * Generate the `:root` block setting default --tenant-primary variables.
 * Call once in the global stylesheet.
 */
export function generateRootTenantVars(): string {
  const defaults = tenantPresets.default;
  return `
:root {
  --tenant-primary: ${defaults.primary};
  --tenant-primary-active: ${defaults.primaryActive};
  --tenant-primary-focus: ${defaults.primaryFocus};
  --tenant-primary-soft: ${defaults.primarySoft};
  --tenant-primary-tint: ${defaults.primaryTint};
  --tenant-on-primary: ${defaults.onPrimary};
}`.trim();
}

/**
 * Generate per-tenant CSS variable overrides.
 * Output format: `[data-tenant="<slug>"] { --tenant-primary: <hex>; ... }`
 */
export function generateTenantStyles(tenant: TenantTheme): string {
  const primary = tenant.primary;
  const primaryActive = tenant.primaryActive ?? darken(primary, 0.12);
  const primaryFocus = tenant.primaryFocus ?? lighten(primary, 0.08);
  const primarySoft = tenant.primarySoft ?? lighten(primary, 0.6);
  const primaryTint = tenant.primaryTint ?? lighten(primary, 0.85);
  const onPrimary = tenant.onPrimary ?? '#ffffff';

  return `
[data-tenant="${tenant.slug}"] {
  --tenant-primary: ${primary};
  --tenant-primary-active: ${primaryActive};
  --tenant-primary-focus: ${primaryFocus};
  --tenant-primary-soft: ${primarySoft};
  --tenant-primary-tint: ${primaryTint};
  --tenant-on-primary: ${onPrimary};
}`.trim();
}

/**
 * Generate a single CSS block with default + all built-in tenant presets.
 * Useful for the marketing site demo / preview.
 */
export function generateAllTenantStyles(): string {
  const blocks: string[] = [generateRootTenantVars()];
  for (const [slug, preset] of Object.entries(tenantPresets)) {
    if (slug === 'default') continue;
    blocks.push(
      generateTenantStyles({
        slug: slug.replace(/([A-Z])/g, '-$1').toLowerCase(),
        ...preset,
      }),
    );
  }
  return blocks.join('\n\n');
}

/**
 * Validate WCAG AA contrast (≥ 4.5:1) between primary and onPrimary.
 * Filament Brand Studio enforces this at upload time.
 */
export function validateTenantContrast(
  primary: string,
  onPrimary = '#ffffff',
): {
  ratio: number;
  passes: boolean;
} {
  const ratio = contrastRatio(primary, onPrimary);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= 4.5,
  };
}

// ── Color math helpers (small subset of chroma.js) ──────────────────────────

function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount);
}

function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount);
}

function mix(hex1: string, hex2: string, ratio: number): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const r = Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio);
  const g = Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio);
  const b = Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio);
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hex1);
  const lum2 = relativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
