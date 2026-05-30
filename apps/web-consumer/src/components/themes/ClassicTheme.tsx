import Image from 'next/image';
import { pickTranslation } from '@/lib/public-api';
import type { ThemeProps } from './types';

/**
 * Classic theme — traditional, elegant restaurant aesthetic.
 *
 * Visual language:
 *   - Centred, symmetrical hero with serif-style display type
 *     (the `--brand-font-heading` variable defaults to Manrope but
 *     tenants can switch to e.g. Playfair Display).
 *   - Tight 8px radii — squares, not pill-shapes.
 *   - Cover image as a wide letterbox above the headline.
 *   - Thin gold/accent rules separating sections.
 *
 * Use case: established sit-down restaurants migrating their existing
 * print-style brand identity onto the web (e.g. white-tablecloth
 * Italian, traditional Uzbek osh house).
 */
export function ClassicTheme({ tenant, brand, restaurant, locale }: ThemeProps) {
  const tenantName =
    typeof tenant.name === 'string'
      ? tenant.name
      : pickTranslation(tenant.name, locale);
  const heroTitle = pickTranslation(brand.hero_title, locale) || tenantName;
  const heroSubtitle =
    pickTranslation(brand.hero_subtitle, locale) ||
    pickTranslation(brand.tagline, locale);

  return (
    <section className="bg-brand-background py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {brand.logo_url && (
          <div className="mb-12 flex justify-center">
            <Image
              src={brand.logo_url}
              alt={tenantName}
              width={140}
              height={140}
              className="h-32 w-auto"
              priority
            />
          </div>
        )}

        {/* Decorative top rule. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-8 h-px w-24"
          style={{ backgroundColor: 'var(--color-brand-accent)' }}
        />

        <h1 className="font-brand-display text-4xl font-bold uppercase tracking-[0.18em] text-brand-text lg:text-6xl">
          {heroTitle}
        </h1>

        {heroSubtitle && (
          <p className="mx-auto mt-8 max-w-2xl text-lg italic leading-relaxed text-brand-text/70">
            {heroSubtitle}
          </p>
        )}

        {/* Decorative bottom rule. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-8 h-px w-24"
          style={{ backgroundColor: 'var(--color-brand-accent)' }}
        />

        <div className="mt-12">
          <a
            href={restaurant ? `/${locale}/restaurants/${restaurant.slug}` : `/${locale}/restaurants`}
            className="inline-flex items-center border-2 px-12 py-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-text transition hover:bg-brand-text hover:text-brand-background"
            style={{
              borderColor: 'var(--color-brand-text)',
              borderRadius: 'var(--brand-radius-button, 4px)',
            }}
          >
            Menu
          </a>
        </div>

        {/* Letterbox cover */}
        {(brand.hero_image_url || brand.cover_image_url) && (
          <div className="relative mt-16 aspect-[16/6] overflow-hidden">
            <Image
              src={(brand.hero_image_url ?? brand.cover_image_url) as string}
              alt={tenantName}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}
