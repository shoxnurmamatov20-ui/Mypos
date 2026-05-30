'use client';

/**
 * Client-side access to the resolved brand.
 *
 * The Server Component layout (`app/[locale]/layout.tsx`) resolves the brand
 * once per request and passes it down through this context. Client components
 * deeper in the tree (e.g. theme switchers, hero CTA, header logo) can read
 * the brand without re-fetching.
 *
 * For performance: the brand is also cached in `localStorage` with a 5-minute
 * TTL keyed by host, so the *very first* paint on subsequent navigations to
 * the same custom domain doesn't show a flash of un-themed content if React
 * hydrates before the SSR-rendered CSS variables apply (rare, but possible
 * on slow devices). The cache is read-only on the client — the source of
 * truth always remains the SSR-resolved brand prop.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Brand, ResolvedTenant } from './brand';
import { MYPOS_DEFAULT_BRAND } from './brand';

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------

type BrandContextValue = {
  /** Resolved tenant — `null` on the marketplace (mypos.uz). */
  tenant: ResolvedTenant | null;
  /** The brand to render with — never `null` (falls back to MyPOS defaults). */
  brand: Brand;
  /** True when running on a tenant custom domain. */
  isTenantBranded: boolean;
};

const BrandContext = createContext<BrandContextValue | null>(null);

// ------------------------------------------------------------
// localStorage cache (client-only, soft cache)
// ------------------------------------------------------------

const BRAND_CACHE_KEY_PREFIX = 'mypos:brand:';
const BRAND_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

type CachedBrand = { value: ResolvedTenant; expiresAt: number };

/**
 * Persist the brand to localStorage so a fast-follow navigation can use it
 * before the next server response lands. We never *trust* this cache for
 * security decisions — it only seeds the visual layer.
 */
function writeBrandCache(host: string, value: ResolvedTenant): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedBrand = {
      value,
      expiresAt: Date.now() + BRAND_CACHE_TTL_MS,
    };
    window.localStorage.setItem(BRAND_CACHE_KEY_PREFIX + host, JSON.stringify(payload));
  } catch {
    // Quota / privacy mode — ignore.
  }
}

/**
 * Read the cached brand for a host. Returns `null` when missing or expired.
 * Exported for unit testing; not used directly by the layout.
 */
export function readBrandCache(host: string): ResolvedTenant | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BRAND_CACHE_KEY_PREFIX + host);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBrand;
    if (parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(BRAND_CACHE_KEY_PREFIX + host);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// Provider
// ------------------------------------------------------------

type BrandProviderProps = {
  /** Resolved tenant — pass `null` for marketplace mode. */
  tenant: ResolvedTenant | null;
  /** The current request's `Host` header — needed for the cache key. */
  host: string | null;
  children: ReactNode;
};

export function BrandProvider({ tenant, host, children }: BrandProviderProps) {
  // Memoise so context consumers don't re-render on every parent re-render.
  const value = useMemo<BrandContextValue>(
    () => ({
      tenant,
      brand: tenant?.brand ?? MYPOS_DEFAULT_BRAND,
      isTenantBranded: tenant !== null,
    }),
    [tenant],
  );

  // Refresh the localStorage cache whenever the SSR brand changes.
  useEffect(() => {
    if (tenant && host) writeBrandCache(host, tenant);
  }, [tenant, host]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

// ------------------------------------------------------------
// Hooks
// ------------------------------------------------------------

/**
 * Read the active brand. Always returns a value — falls back to MyPOS
 * defaults when no provider is mounted (e.g. in unit tests).
 */
export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (ctx) return ctx;
  return {
    tenant: null,
    brand: MYPOS_DEFAULT_BRAND,
    isTenantBranded: false,
  };
}
