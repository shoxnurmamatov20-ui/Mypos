'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp } from './animations';

/**
 * Apple closing tile — dark band with center-stacked headline + pill CTAs.
 * No mesh gradients, no glassmorphism, no nested rounded cards.
 */
export function CtaSection() {
  const t = useTranslations('cta');
  const locale = useLocale();

  return (
    <section className="bg-tile-dark-1 text-on-dark">
      <div className="mx-auto max-w-3xl px-md py-section text-center sm:px-lg">
        <FadeUp>
          <h2 className="text-display-lg text-on-dark font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl text-lead text-on-dark-muted font-display">
            {t('subtitle')}
          </p>

          <div className="mt-lg flex flex-col items-center justify-center gap-xs sm:flex-row sm:gap-md">
            <Link
              href={`/${locale}/get-started`}
              className="inline-flex h-12 items-center rounded-pill bg-tenant px-lg text-body text-tenant-on-primary transition-transform duration-fast active:scale-95"
            >
              {t('button')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-12 items-center text-body text-coral-on-dark transition-transform duration-fast active:scale-95"
            >
              {t('secondary')} <span className="ml-xxs">›</span>
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
