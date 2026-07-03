'use client';

import { motion } from 'framer-motion';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

/**
 * "First-order" promo card. The CTA points to /search so a new visitor
 * lands on the catalogue rather than a dedicated promo page (until that
 * route exists).
 */
export function PromoBanner() {
  const t = useTranslations('home');
  const locale = useLocale();
  const ctaHref = `/${locale}/search` as Route;

  return (
    <section className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-purple-500 p-8 sm:p-12 lg:p-16"
        >
          {/* Decorative circles. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-purple-500/30 blur-2xl"
          />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="font-bold uppercase tracking-wide text-white/90">
                <span aria-hidden="true">🎉 </span>
                {t('promo_eyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {t('promo_title')}
              </h2>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-xl bg-white/20 px-4 py-2 font-mono text-sm font-bold text-white backdrop-blur-sm sm:text-base">
                  {t('promo_code')}
                </span>
                <Link
                  href={ctaHref}
                  className="inline-flex h-12 items-center rounded-2xl bg-white px-6 text-sm font-bold text-brand-600 shadow-lg transition hover:bg-neutral-50 active:scale-95"
                >
                  {t('promo_cta')}
                </Link>
              </div>
            </div>

            <motion.div
              animate={{ rotate: [-4, 6, -4], y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden text-[10rem] leading-none drop-shadow-2xl lg:block"
              aria-hidden="true"
            >
              🎁
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
