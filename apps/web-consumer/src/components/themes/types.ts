/**
 * Shared types used by all theme templates (Modern / Classic / Minimal /
 * Premium). Every theme component receives the same props bundle so the
 * dispatcher (`<TenantThemeShell>`) can switch between them by `theme`
 * key alone.
 */

import type { Brand, ResolvedTenant } from '@/lib/brand';
import type { PublicMenuResponse, PublicRestaurant } from '@/lib/public-api';

export type ThemeProps = {
  /** Resolved tenant — never `null` inside a theme component. */
  tenant: ResolvedTenant;
  /** Convenience alias for `tenant.brand`. */
  brand: Brand;
  /** Hero / above-the-fold restaurant headline. */
  restaurant: PublicRestaurant | null;
  /** Optional menu payload — when omitted, themes render hero only. */
  menu?: PublicMenuResponse['data'] | null;
  /** Active locale (uz/ru/en) — passed through from layout params. */
  locale: 'uz' | 'ru' | 'en';
};
