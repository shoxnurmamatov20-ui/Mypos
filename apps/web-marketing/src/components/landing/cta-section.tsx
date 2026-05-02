'use client';

import { ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp } from './animations';

export function CtaSection() {
  const t = useTranslations('cta');
  const locale = useLocale();

  return (
    <section className="modern-gradient ops-grid text-on-dark">
      <div className="mx-auto max-w-4xl px-md py-section text-center sm:px-lg">
        <FadeUp>
          <h2 className="font-display text-display-lg font-semibold text-white">{t('title')}</h2>
          <p className="mx-auto mt-md max-w-xl font-display text-lead text-white/70">
            {t('subtitle')}
          </p>

          <div className="mt-lg flex flex-col items-center justify-center gap-xs sm:flex-row sm:gap-md">
            <Link
              href={`/${locale}/get-started`}
              className="inline-flex h-12 items-center gap-xs rounded-pill bg-tenant px-lg text-body-strong text-tenant-on-primary shadow-[0_14px_34px_rgba(234,124,105,0.28)] transition-transform duration-fast active:scale-95"
            >
              {t('button')}
              <ArrowRight size={20} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-12 items-center rounded-pill border border-white/10 bg-white/10 px-lg text-body-strong text-white transition-transform duration-fast hover:bg-white/[0.15] active:scale-95"
            >
              {t('secondary')}
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
