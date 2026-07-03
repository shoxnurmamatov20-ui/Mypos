/**
 * C7 — Phase 2 — Brand context + CSS variable serialisation.
 *
 * Tests the pure functions in `lib/brand.ts` and the localStorage cache
 * helpers in `lib/brand-context.tsx`. We deliberately avoid mounting the
 * React provider component because the consumer's vitest config runs in
 * the `node` environment (no `jsdom`, no `@testing-library/react` in
 * devDeps). The provider behaviour is therefore exercised through:
 *   1. `brandToCssVars` (pure)
 *   2. `readBrandCache` (localStorage I/O via the polyfill below)
 *   3. `isOwnDomain` host-classifier (pure)
 *   4. `fetchBrandForHost` (network — global.fetch shim)
 *
 * If `@testing-library/react` lands in devDeps later, add a JSX-mount
 * variant under `brand-provider.test.tsx`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- in-memory localStorage polyfill ----------
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('window', { localStorage: globalThis.localStorage });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ----------------------------------------------------------
// brandToCssVars
// ----------------------------------------------------------

describe('brandToCssVars', () => {
  it('produces CSS variables for every brand colour and font field', async () => {
    const { brandToCssVars, MYPOS_DEFAULT_BRAND } = await import('../lib/brand');

    const vars = brandToCssVars({
      ...MYPOS_DEFAULT_BRAND,
      primary_color: '#FF0000',
      accent_color: '#00FF00',
      text_color: '#0F172A',
      background_color: '#FFFFFF',
      font_family: 'Roboto',
      font_heading: 'Manrope',
    });

    expect(vars['--brand-primary']).toBe('#FF0000');
    expect(vars['--brand-accent']).toBe('#00FF00');
    expect(vars['--brand-text']).toBe('#0F172A');
    expect(vars['--brand-background']).toBe('#FFFFFF');
    expect(vars['--brand-font']).toBe('Roboto');
    expect(vars['--brand-font-heading']).toBe('Manrope');
  });

  it('falls back to MYPOS defaults when given null', async () => {
    const { brandToCssVars, MYPOS_DEFAULT_BRAND } = await import('../lib/brand');

    const vars = brandToCssVars(null);
    expect(vars['--brand-primary']).toBe(MYPOS_DEFAULT_BRAND.primary_color);
    expect(vars['--brand-accent']).toBe(MYPOS_DEFAULT_BRAND.accent_color);
    expect(vars['--brand-font']).toBe(MYPOS_DEFAULT_BRAND.font_family);
  });

  it('uses font_family as font_heading fallback when heading is null', async () => {
    const { brandToCssVars, MYPOS_DEFAULT_BRAND } = await import('../lib/brand');

    const vars = brandToCssVars({
      ...MYPOS_DEFAULT_BRAND,
      font_family: 'Inter',
      font_heading: null,
    });
    expect(vars['--brand-font-heading']).toBe('Inter');
  });
});

// ----------------------------------------------------------
// isOwnDomain
// ----------------------------------------------------------

describe('isOwnDomain', () => {
  it('treats mypos.uz, *.mypos.uz, localhost, 127.0.0.1 as own', async () => {
    const { isOwnDomain } = await import('../lib/brand');
    expect(isOwnDomain('mypos.uz')).toBe(true);
    expect(isOwnDomain('app.mypos.uz')).toBe(true);
    expect(isOwnDomain('admin.mypos.uz')).toBe(true);
    expect(isOwnDomain('localhost')).toBe(true);
    expect(isOwnDomain('localhost:3002')).toBe(true);
    expect(isOwnDomain('127.0.0.1')).toBe(true);
  });

  it('treats real custom domains as foreign (returns false)', async () => {
    const { isOwnDomain } = await import('../lib/brand');
    expect(isOwnDomain('jomeburger.uz')).toBe(false);
    expect(isOwnDomain('shop.lavashhouse.com')).toBe(false);
    expect(isOwnDomain('customrestaurant.com')).toBe(false);
  });

  it('treats empty host as own (defensive null-safety)', async () => {
    const { isOwnDomain } = await import('../lib/brand');
    expect(isOwnDomain('')).toBe(true);
  });
});

// ----------------------------------------------------------
// stripPort
// ----------------------------------------------------------

describe('stripPort', () => {
  it('strips :port from a Host header value', async () => {
    const { stripPort } = await import('../lib/brand');
    expect(stripPort('localhost:3002')).toBe('localhost');
    expect(stripPort('mypos.uz')).toBe('mypos.uz');
    expect(stripPort('jomeburger.uz:443')).toBe('jomeburger.uz');
  });
});

// ----------------------------------------------------------
// readBrandCache
// ----------------------------------------------------------

describe('readBrandCache (localStorage)', () => {
  it('returns null when the cache key is missing', async () => {
    const { readBrandCache } = await import('../lib/brand-context');
    expect(readBrandCache('jomeburger.uz')).toBeNull();
  });

  it('returns the cached brand when entry is fresh', async () => {
    const { readBrandCache } = await import('../lib/brand-context');
    const fakeTenant = {
      slug: 'jome',
      name: 'JomeBurger',
      short_name: 'Jome',
      brand: {
        theme: 'modern' as const,
        logo_url: null,
        logo_dark_url: null,
        favicon_url: null,
        cover_image_url: null,
        hero_image_url: null,
        og_image_url: null,
        primary_color: '#FF0000',
        accent_color: '#00FF00',
        text_color: '#0F172A',
        background_color: '#FFFFFF',
        font_family: 'Inter',
        font_heading: null,
        hero_title: null,
        hero_subtitle: null,
        tagline: null,
        custom_css: null,
        instagram_handle: null,
        facebook_url: null,
        telegram_handle: null,
      },
    };
    globalThis.localStorage.setItem(
      'mypos:brand:jomeburger.uz',
      JSON.stringify({ value: fakeTenant, expiresAt: Date.now() + 60_000 }),
    );

    expect(readBrandCache('jomeburger.uz')).toEqual(fakeTenant);
  });

  it('returns null and removes entry when cache has expired', async () => {
    const { readBrandCache } = await import('../lib/brand-context');
    globalThis.localStorage.setItem(
      'mypos:brand:expired.uz',
      JSON.stringify({ value: { slug: 'x' }, expiresAt: Date.now() - 1000 }),
    );

    expect(readBrandCache('expired.uz')).toBeNull();
    expect(globalThis.localStorage.getItem('mypos:brand:expired.uz')).toBeNull();
  });

  it('returns null on malformed JSON without throwing', async () => {
    const { readBrandCache } = await import('../lib/brand-context');
    globalThis.localStorage.setItem('mypos:brand:bad.uz', 'not json');
    expect(readBrandCache('bad.uz')).toBeNull();
  });
});

// ----------------------------------------------------------
// fetchBrandForHost
// ----------------------------------------------------------

describe('fetchBrandForHost', () => {
  const ORIGINAL_FETCH = global.fetch;
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  it('returns null without hitting the API for own domains', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof global.fetch;

    const { fetchBrandForHost } = await import('../lib/brand');

    expect(await fetchBrandForHost('mypos.uz')).toBeNull();
    expect(await fetchBrandForHost('app.mypos.uz')).toBeNull();
    expect(await fetchBrandForHost('localhost:3002')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null when the API responds non-2xx', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response('{"message":"not found"}', {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ) as unknown as typeof global.fetch;

    const { fetchBrandForHost } = await import('../lib/brand');
    expect(await fetchBrandForHost('jomeburger.uz')).toBeNull();
  });

  it('returns null when the network throws (graceful degradation)', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    ) as unknown as typeof global.fetch;
    const { fetchBrandForHost } = await import('../lib/brand');
    expect(await fetchBrandForHost('jomeburger.uz')).toBeNull();
  });

  it('returns the resolved tenant on a successful response', async () => {
    const payload = {
      data: {
        slug: 'jome',
        name: 'JomeBurger',
        short_name: 'Jome',
        brand: {
          theme: 'modern',
          logo_url: null,
          logo_dark_url: null,
          favicon_url: null,
          cover_image_url: null,
          hero_image_url: null,
          og_image_url: null,
          primary_color: '#FF0000',
          accent_color: '#00FF00',
          text_color: '#0F172A',
          background_color: '#FFFFFF',
          font_family: 'Inter',
          font_heading: null,
          hero_title: null,
          hero_subtitle: null,
          tagline: null,
          custom_css: null,
          instagram_handle: null,
          facebook_url: null,
          telegram_handle: null,
        },
      },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ) as unknown as typeof global.fetch;

    const { fetchBrandForHost } = await import('../lib/brand');
    const tenant = await fetchBrandForHost('jomeburger.uz');
    expect(tenant?.slug).toBe('jome');
    expect(tenant?.brand.primary_color).toBe('#FF0000');
  });

  it('passes the host as the `host` query parameter', async () => {
    const captured: string[] = [];
    global.fetch = vi.fn((input: RequestInfo) => {
      captured.push(typeof input === 'string' ? input : input.toString());
      return Promise.resolve(
        new Response('{"data":null}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }) as unknown as typeof global.fetch;

    const { fetchBrandForHost } = await import('../lib/brand');
    await fetchBrandForHost('jomeburger.uz');

    expect(captured[0]).toContain('host=jomeburger.uz');
    expect(captured[0]).toContain('/api/v1/public/resolve-domain');
  });
});

// ----------------------------------------------------------
// MYPOS_DEFAULT_BRAND constants
// ----------------------------------------------------------

describe('MYPOS_DEFAULT_BRAND constants', () => {
  it('defaults to "modern" theme', async () => {
    const { MYPOS_DEFAULT_BRAND } = await import('../lib/brand');
    expect(MYPOS_DEFAULT_BRAND.theme).toBe('modern');
  });

  it('uses MyPOS brand colors as documented in design-tokens', async () => {
    const { MYPOS_DEFAULT_BRAND } = await import('../lib/brand');
    expect(MYPOS_DEFAULT_BRAND.primary_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(MYPOS_DEFAULT_BRAND.accent_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(MYPOS_DEFAULT_BRAND.background_color).toBe('#FFFFFF');
  });

  it('null-safe: every optional field defaults to null', async () => {
    const { MYPOS_DEFAULT_BRAND } = await import('../lib/brand');
    expect(MYPOS_DEFAULT_BRAND.logo_url).toBeNull();
    expect(MYPOS_DEFAULT_BRAND.hero_title).toBeNull();
    expect(MYPOS_DEFAULT_BRAND.tagline).toBeNull();
    expect(MYPOS_DEFAULT_BRAND.custom_css).toBeNull();
    expect(MYPOS_DEFAULT_BRAND.instagram_handle).toBeNull();
  });
});
