/**
 * C7 — Phase 2 — Theme template dispatcher.
 *
 * The consumer app renders one of four themes (`modern`/`classic`/`minimal`/
 * `premium`) based on `brand.theme`. `TenantThemeShell` is a thin switch
 * that dispatches to the right component.
 *
 * We test the dispatch contract WITHOUT mounting the DOM — vitest is in
 * `node` env and there's no `@testing-library/react` / `jsdom` in
 * devDeps. We mock the four theme components with stubs that capture
 * their props, then assert the dispatcher routed correctly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement } from 'react';
import type { ResolvedTenant } from '../lib/brand';
import { MYPOS_DEFAULT_BRAND } from '../lib/brand';

// ----------------------------------------------------------
// Mocks — replace each theme with a named stub so we can inspect
// which one TenantThemeShell rendered.
// ----------------------------------------------------------

vi.mock('../components/themes/ModernTheme', () => ({
  ModernTheme: function MockModernTheme(_props: unknown) {
    return null;
  },
}));
vi.mock('../components/themes/ClassicTheme', () => ({
  ClassicTheme: function MockClassicTheme(_props: unknown) {
    return null;
  },
}));
vi.mock('../components/themes/MinimalTheme', () => ({
  MinimalTheme: function MockMinimalTheme(_props: unknown) {
    return null;
  },
}));
vi.mock('../components/themes/PremiumTheme', () => ({
  PremiumTheme: function MockPremiumTheme(_props: unknown) {
    return null;
  },
}));

// ----------------------------------------------------------
// Fixture
// ----------------------------------------------------------

function makeTenant(theme: 'modern' | 'classic' | 'minimal' | 'premium'): ResolvedTenant {
  return {
    slug: 'jome',
    name: 'JomeBurger',
    short_name: 'Jome',
    brand: { ...MYPOS_DEFAULT_BRAND, theme },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ----------------------------------------------------------
// TenantThemeShell dispatches by brand.theme
// ----------------------------------------------------------

describe('TenantThemeShell dispatcher', () => {
  it('renders ModernTheme when brand.theme is "modern"', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('modern');

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'uz',
    });

    expect(isValidElement(el)).toBe(true);
    const elementType = el && (el as { type?: { name?: string } }).type;
    expect(elementType?.name).toBe('MockModernTheme');
  });

  it('renders ClassicTheme when brand.theme is "classic"', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('classic');

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'uz',
    });

    expect(isValidElement(el)).toBe(true);
    const elementType = el && (el as { type?: { name?: string } }).type;
    expect(elementType?.name).toBe('MockClassicTheme');
  });

  it('renders MinimalTheme when brand.theme is "minimal"', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('minimal');

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'uz',
    });

    const elementType = el && (el as { type?: { name?: string } }).type;
    expect(elementType?.name).toBe('MockMinimalTheme');
  });

  it('renders PremiumTheme when brand.theme is "premium"', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('premium');

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'uz',
    });

    const elementType = el && (el as { type?: { name?: string } }).type;
    expect(elementType?.name).toBe('MockPremiumTheme');
  });

  it('falls back to ModernTheme for unknown / future theme values', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('modern');
    tenant.brand = { ...tenant.brand, theme: 'galactic' as never };

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'uz',
    });

    const elementType = el && (el as { type?: { name?: string } }).type;
    expect(elementType?.name).toBe('MockModernTheme');
  });

  it('forwards the brand prop to the dispatched theme', async () => {
    const { TenantThemeShell } = await import('../components/themes/TenantThemeShell');
    const tenant = makeTenant('modern');
    tenant.brand = {
      ...tenant.brand,
      primary_color: '#ABCDEF',
    };

    const el = TenantThemeShell({
      tenant,
      brand: tenant.brand,
      restaurant: null,
      locale: 'ru',
    });

    const props = el && (el as { props: { brand: { primary_color: string }; locale: string } }).props;
    expect(props?.brand.primary_color).toBe('#ABCDEF');
    expect(props?.locale).toBe('ru');
  });
});
