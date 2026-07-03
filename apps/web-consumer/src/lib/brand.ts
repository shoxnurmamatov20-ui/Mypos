/**
 * Brand resolution & fetching for the multi-tenant web-consumer.
 *
 * Two modes of operation:
 *
 * 1. Marketplace mode — request reaches us via `mypos.uz` (or any preview
 *    `*.mypos.uz` / `localhost`). `brand` resolves to `null` and the app
 *    renders with MyPOS defaults.
 *
 * 2. Tenant mode — request reaches us via the tenant's custom domain
 *    (e.g. `jomeburger.uz`). The middleware (Edge runtime) attaches the
 *    resolved tenant slug as the `X-Tenant-Slug` request header, then this
 *    module fetches the matching `tenant_brands` row from the public API
 *    on each Server Component render.
 *
 * Why two layers?
 * - Edge middleware is fast and lets us 302-redirect on un-verified domains
 *   without ever touching React, but the brand JSON is too heavy to pin to
 *   every request.
 * - Layout-side fetching benefits from Next's HTTP cache (`revalidate: 60`)
 *   so the actual API call is amortised across all SSR renders within the
 *   60s ISR window per (host, locale) tuple.
 *
 * NOTE — Contract dependency on Agent C3:
 *   This module assumes the existence of `GET /api/v1/public/resolve-domain`
 *   on the Laravel API. Until C3 ships it, `fetchBrandForHost()` returns
 *   `null` and the app falls back to marketplace defaults; nothing crashes.
 *   See `Brand` and `ResolveDomainResponse` types below for the expected
 *   contract.
 */

import type { TranslatedString } from '@mypos/api-client';

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

/**
 * The API base URL the *server* uses for internal traffic. Distinct from
 * `NEXT_PUBLIC_API_URL` because in production the public URL is via the
 * gateway (`api.mypos.uz`) but server-to-server we may go direct on the
 * private network.
 *
 * Falls back to the public URL, then to localhost, in that order.
 */
const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';

/**
 * Cache window for the `resolve-domain` lookup. Keep it short — we want
 * a tenant who just verified their domain to see their brand promptly,
 * but we also don't want to hit the API on every navigation.
 */
const BRAND_REVALIDATE_SECONDS = 60;

/**
 * Hosts that should *never* attempt domain resolution. Includes our own
 * roots, all `*.mypos.uz` previews, and dev hosts.
 *
 * Exported for use in the middleware (it does the same check before
 * calling out to the API).
 */
export const OWN_DOMAINS = [
  'mypos.uz',
  'www.mypos.uz',
  'localhost',
  'localhost:3002',
  '127.0.0.1',
  '127.0.0.1:3002',
] as const;

export const OWN_DOMAIN_SUFFIXES = ['.mypos.uz', '.localhost', '.local'] as const;

// ------------------------------------------------------------
// Types — must mirror the backend `tenant_brands` row + envelope
// ------------------------------------------------------------

export type BrandTheme = 'modern' | 'classic' | 'minimal' | 'premium';

/**
 * Brand definition consumed by the app. The shape mirrors the backend's
 * `tenant_brands` table (see `2026_05_15_000002_create_tenant_brands_table`)
 * with optional fields normalised to `null`.
 */
export type Brand = {
  /** Theme template — controls layout aesthetic. */
  theme: BrandTheme;

  /** Asset URLs (MinIO, *.cdn.mypos.uz). All optional. */
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  cover_image_url: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;

  /** Colors — 7-char hex. Defaults match MyPOS brand. */
  primary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;

  /** Typography. */
  font_family: string;
  font_heading: string | null;

  /** Marketing copy — i18n. */
  hero_title: TranslatedString | null;
  hero_subtitle: TranslatedString | null;
  tagline: TranslatedString | null;

  /** Custom CSS (Plus tier). Sanitised by the backend. */
  custom_css: string | null;

  /** Social. */
  instagram_handle: string | null;
  facebook_url: string | null;
  telegram_handle: string | null;
};

/**
 * Tenant + brand bundle returned by `/api/v1/public/resolve-domain`.
 *
 * Used by middleware (slug, theme) and by the Server Component layout
 * (the full `brand` object).
 */
export type ResolveDomainResponse = {
  data: {
    /** Tenant slug — used as the public identifier. */
    slug: string;
    /** Display name. May be a `TranslatedString` once the backend supports it. */
    name: string | TranslatedString;
    /** Short name for PWA install. */
    short_name: string | null;
    /** Brand row. */
    brand: Brand;
  };
};

export type ResolvedTenant = ResolveDomainResponse['data'];

// ------------------------------------------------------------
// Defaults — MyPOS marketplace brand
// ------------------------------------------------------------

/**
 * Marketplace defaults when no tenant is resolved (i.e. `mypos.uz`).
 * Mirrors `packages/design-tokens/src/colors.ts` brand values.
 */
export const MYPOS_DEFAULT_BRAND: Brand = {
  theme: 'modern',
  logo_url: null,
  logo_dark_url: null,
  favicon_url: '/favicon.ico',
  cover_image_url: null,
  hero_image_url: null,
  og_image_url: null,
  primary_color: '#EA7C69',
  accent_color: '#8B5CF6',
  text_color: '#0F172A',
  background_color: '#FFFFFF',
  font_family: 'Inter',
  font_heading: 'Manrope',
  hero_title: null,
  hero_subtitle: null,
  tagline: null,
  custom_css: null,
  instagram_handle: null,
  facebook_url: null,
  telegram_handle: null,
};

// ------------------------------------------------------------
// Host helpers
// ------------------------------------------------------------

/**
 * Strip the port from a `Host` header value (`localhost:3002` → `localhost`).
 * Some matchers want the bare host, some want host+port.
 */
export function stripPort(host: string): string {
  const i = host.indexOf(':');
  return i === -1 ? host : host.slice(0, i);
}

/**
 * Returns true when the host is one of our own (mypos.uz, *.mypos.uz, dev).
 * The middleware uses this to short-circuit before calling the API.
 */
export function isOwnDomain(host: string): boolean {
  if (!host) return true; // No host header — treat as own.
  const lower = host.toLowerCase();

  if ((OWN_DOMAINS as readonly string[]).includes(lower)) return true;
  if ((OWN_DOMAINS as readonly string[]).includes(stripPort(lower))) return true;
  if (OWN_DOMAIN_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true;

  return false;
}

// ------------------------------------------------------------
// API fetchers
// ------------------------------------------------------------

/**
 * Server-side resolver. Fetches the tenant + brand bundle for a host.
 *
 * Returns `null` when:
 *   - The host is one of our own (no resolution needed).
 *   - The API is unreachable / returns 4xx-5xx (graceful degradation —
 *     the page still renders, just with marketplace defaults).
 *   - The API endpoint is not yet deployed (Agent C3 dependency).
 *
 * Callers must treat `null` as "render with defaults", not as an error.
 */
export async function fetchBrandForHost(
  host: string | null | undefined,
): Promise<ResolvedTenant | null> {
  if (!host || isOwnDomain(host)) return null;

  const url = `${INTERNAL_API_URL}/api/v1/public/resolve-domain?host=${encodeURIComponent(host)}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: {
        revalidate: BRAND_REVALIDATE_SECONDS,
        tags: [`brand:${host}`],
      },
    });

    if (!response.ok) return null;

    const json = (await response.json()) as ResolveDomainResponse;
    return json.data ?? null;
  } catch {
    // Backend unavailable — fall back to marketplace defaults.
    // Don't `console.error` in a Server Component path; observability
    // is handled at the gateway / Sentry layer.
    return null;
  }
}

// ------------------------------------------------------------
// CSS-variable serialiser
// ------------------------------------------------------------

/**
 * Serialise a `Brand` (or default) to a `style` object suitable for
 * `<html style={...}>` injection. Tailwind utilities reference these
 * via `bg-brand-primary` etc. (see `tailwind.config.ts`).
 *
 * We deliberately set fallbacks even for "MyPOS default" so that the
 * brand utility classes always resolve, regardless of whether a tenant
 * has been resolved yet.
 */
export function brandToCssVars(brand: Brand | null): Record<string, string> {
  const b = brand ?? MYPOS_DEFAULT_BRAND;
  // Note: `--color-brand-*` matches the names declared in `@theme {}`
  // so Tailwind utilities (bg-brand-primary, text-brand-text, …) pick
  // up the override automatically. The non-color vars (font + radius)
  // live under the `--brand-*` namespace and are read by raw CSS.
  return {
    '--color-brand-primary': b.primary_color,
    '--color-brand-accent': b.accent_color,
    '--color-brand-text': b.text_color,
    '--color-brand-background': b.background_color,
    '--brand-font': b.font_family,
    '--brand-font-heading': b.font_heading ?? b.font_family,
  };
}
