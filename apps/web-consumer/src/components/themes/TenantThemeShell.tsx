import { ClassicTheme } from './ClassicTheme';
import { MinimalTheme } from './MinimalTheme';
import { ModernTheme } from './ModernTheme';
import { PremiumTheme } from './PremiumTheme';
import type { ThemeProps } from './types';

/**
 * Dispatcher that picks one of the four theme templates based on the
 * resolved tenant's `brand.theme` value. This is the single point at which
 * pages decide which aesthetic to render.
 *
 * Usage from a page:
 *
 * ```tsx
 * const tenant = await fetchBrandForHost(host);
 * if (!tenant) return <MarketplaceHome />;
 * return <TenantThemeShell tenant={tenant} brand={tenant.brand} ... />;
 * ```
 *
 * Adding a new theme:
 *   1. Create `<NewTheme>` matching `ThemeProps`.
 *   2. Add it to the switch below.
 *   3. Add the literal to `BrandTheme` in `lib/brand.ts`.
 *   4. Add `data-theme=` styles to `globals.css` if needed.
 */
export function TenantThemeShell(props: ThemeProps) {
  switch (props.brand.theme) {
    case 'classic':
      return <ClassicTheme {...props} />;
    case 'minimal':
      return <MinimalTheme {...props} />;
    case 'premium':
      return <PremiumTheme {...props} />;
    case 'modern':
    default:
      return <ModernTheme {...props} />;
  }
}
