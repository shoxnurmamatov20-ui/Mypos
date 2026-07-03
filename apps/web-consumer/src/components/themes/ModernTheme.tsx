import Image from 'next/image';
import { pickTranslation } from '@/lib/public-api';
import type { ThemeProps } from './types';

/**
 * Modern theme — the default aesthetic.
 *
 * Visual language:
 *   - Bold, gradient hero spanning the viewport with the brand cover image.
 *   - Generous radii (24px on cards, 12px on buttons — see `globals.css`).
 *   - Mesh-gradient blobs in the brand-primary tone.
 *   - Tall sans-serif headlines (`font-brand-display`).
 *
 * Use case: restaurants leaning into the trendy, app-like delivery
 * experience (Wolt / DoorDash vibe).
 */
export function ModernTheme({ tenant, brand, restaurant, locale }: ThemeProps) {
  const tenantName =
    typeof tenant.name === 'string' ? tenant.name : pickTranslation(tenant.name, locale);
  const heroTitle = pickTranslation(brand.hero_title, locale) || tenantName;
  const heroSubtitle =
    pickTranslation(brand.hero_subtitle, locale) || pickTranslation(brand.tagline, locale);

  return (
    <section className="relative overflow-hidden bg-brand-background pb-24 pt-16">
      {/* Mesh blobs in the brand-primary tone. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: 'var(--color-brand-primary)' }}
        />
        <div
          className="absolute right-0 top-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: 'var(--color-brand-accent)' }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          {brand.logo_url && (
            <Image
              src={brand.logo_url}
              alt={tenantName}
              width={120}
              height={120}
              className="mb-8 h-24 w-auto"
              priority
            />
          )}
          <h1 className="font-brand-display text-5xl font-extrabold leading-[1.05] tracking-tight text-brand-text lg:text-7xl">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mt-6 max-w-xl text-lg text-brand-text/70 lg:text-xl">{heroSubtitle}</p>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={
                restaurant ? `/${locale}/restaurants/${restaurant.slug}` : `/${locale}/restaurants`
              }
              className="inline-flex items-center rounded-2xl bg-brand-primary px-8 py-4 font-bold text-white shadow-xl transition hover:opacity-90"
            >
              {pickTranslation(brand.tagline, locale) || 'Buyurtma berish'}
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] shadow-2xl">
          {brand.hero_image_url || brand.cover_image_url ? (
            <Image
              src={(brand.hero_image_url ?? brand.cover_image_url) as string}
              alt={tenantName}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))`,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
