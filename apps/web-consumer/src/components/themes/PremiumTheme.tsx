import Image from 'next/image';
import { pickTranslation } from '@/lib/public-api';
import type { ThemeProps } from './types';

/**
 * Premium theme — fine-dining / luxury aesthetic.
 *
 * Visual language:
 *   - Dark canvas (overrides `--brand-background` if the merchant
 *     hasn't already chosen a dark palette), gold/accent gradients.
 *   - Full-bleed cinematic hero with subtle Ken-Burns scale-in.
 *   - Mid-weight serif headlines, generous letterspacing.
 *   - 16px radii (softer than Classic, sharper than Modern).
 *   - "RESERVE" CTA framed in gold rule lines.
 *
 * Use case: omakase, chef's tasting menus, hotel restaurants —
 * places where the menu is curated and the brand identity is the
 * primary draw.
 */
export function PremiumTheme({ tenant, brand, restaurant, locale }: ThemeProps) {
  const tenantName =
    typeof tenant.name === 'string' ? tenant.name : pickTranslation(tenant.name, locale);
  const heroTitle = pickTranslation(brand.hero_title, locale) || tenantName;
  const heroSubtitle =
    pickTranslation(brand.hero_subtitle, locale) || pickTranslation(brand.tagline, locale);

  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
      {/* Cinematic background. */}
      {brand.hero_image_url || brand.cover_image_url ? (
        <Image
          src={(brand.hero_image_url ?? brand.cover_image_url) as string}
          alt={tenantName}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, var(--color-brand-primary), var(--color-brand-text))`,
          }}
        />
      )}

      {/* Dark vignette for legibility over photography. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center text-white">
        {brand.logo_url && (
          <Image
            src={brand.logo_url}
            alt={tenantName}
            width={120}
            height={120}
            className="mb-8 h-24 w-auto invert brightness-0"
            priority
          />
        )}

        <p
          className="text-xs font-semibold uppercase tracking-[0.4em]"
          style={{ color: 'var(--color-brand-accent)' }}
        >
          {tenantName}
        </p>

        <h1 className="mt-6 font-brand-display text-5xl font-light leading-[1.1] tracking-wide text-white lg:text-7xl">
          {heroTitle}
        </h1>

        {heroSubtitle && (
          <p className="mt-8 max-w-2xl text-lg italic text-white/80">{heroSubtitle}</p>
        )}

        {/* Gold-framed CTA. */}
        <div className="mt-12 flex items-center gap-6">
          <span
            aria-hidden="true"
            className="h-px w-12"
            style={{ backgroundColor: 'var(--color-brand-accent)' }}
          />
          <a
            href={
              restaurant ? `/${locale}/restaurants/${restaurant.slug}` : `/${locale}/restaurants`
            }
            className="text-sm font-semibold uppercase tracking-[0.3em] text-white"
          >
            Reserve · Order
          </a>
          <span
            aria-hidden="true"
            className="h-px w-12"
            style={{ backgroundColor: 'var(--color-brand-accent)' }}
          />
        </div>
      </div>
    </section>
  );
}
