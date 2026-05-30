import Image from 'next/image';
import { pickTranslation } from '@/lib/public-api';
import type { ThemeProps } from './types';

/**
 * Minimal theme — flat, type-driven, zero ornament.
 *
 * Visual language:
 *   - No radii (sharp corners), no shadows, no gradients.
 *   - Mono-tone palette — brand colours used sparingly as accents only.
 *   - Massive typographic hierarchy: headline at 9xl/10rem clamp on
 *     large screens.
 *   - Generous whitespace — full-bleed sections separated by 12rem.
 *   - The cover image (if any) is set as a small inline thumbnail
 *     rather than a hero.
 *
 * Use case: design-forward speciality coffee, third-wave bakeries,
 * boutique chef-driven concepts where the brand is "the food" and the
 * site should feel almost magazine-like.
 */
export function MinimalTheme({ tenant, brand, restaurant, locale }: ThemeProps) {
  const tenantName =
    typeof tenant.name === 'string'
      ? tenant.name
      : pickTranslation(tenant.name, locale);
  const heroTitle = pickTranslation(brand.hero_title, locale) || tenantName;
  const heroSubtitle =
    pickTranslation(brand.hero_subtitle, locale) ||
    pickTranslation(brand.tagline, locale);

  return (
    <section className="bg-brand-background py-32 lg:py-48">
      <div className="mx-auto max-w-6xl px-6 sm:px-12">
        {/* Wordmark — text-only, no logo image. */}
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-text/60">
          {tenantName}
        </p>

        <h1 className="mt-16 font-brand-display text-[clamp(3rem,12vw,10rem)] font-bold leading-[0.95] tracking-tighter text-brand-text">
          {heroTitle}
        </h1>

        {heroSubtitle && (
          <p className="mt-12 max-w-xl text-xl leading-relaxed text-brand-text/70">
            {heroSubtitle}
          </p>
        )}

        <div className="mt-16 flex items-center gap-8 border-t border-brand-text/10 pt-8">
          <a
            href={restaurant ? `/${locale}/restaurants/${restaurant.slug}` : `/${locale}/restaurants`}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text underline-offset-8 hover:underline"
          >
            View menu →
          </a>
          {brand.cover_image_url && (
            <div className="ml-auto h-12 w-12 overflow-hidden">
              <Image
                src={brand.cover_image_url}
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-cover grayscale"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
