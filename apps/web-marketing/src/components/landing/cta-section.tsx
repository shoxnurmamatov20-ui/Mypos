import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export function CtaSection() {
  const t = useTranslations('cta');
  const locale = useLocale();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-6 py-14 text-center shadow-2xl shadow-brand-500/20 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
          >
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-12 h-96 w-96 rounded-full bg-mint-400/30 blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t('title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-brand-50 sm:text-lg">
              {t('subtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/${locale}/contact`}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-display text-base font-bold text-brand-700 shadow-lg transition hover:bg-brand-50 sm:text-lg"
              >
                {t('button')}
                <ArrowRight
                  className="h-5 w-5 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {t('secondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
